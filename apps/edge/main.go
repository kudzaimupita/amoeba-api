package main

import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/hashicorp/yamux"
)

const protocolVersion = "1"

type identity struct {
	CredentialID string `json:"credentialId"`
	NodeID       string `json:"nodeId"`
	CompanyID    string `json:"companyId"`
}

type route struct {
	Hostname     string `json:"hostname"`
	CompanyID    string `json:"companyId"`
	NodeID       string `json:"nodeId"`
	WorkloadID   string `json:"workloadId"`
	DeploymentID string `json:"deploymentId"`
	LocalPort    int    `json:"localPort"`
	Available    bool   `json:"available"`
}

type edge struct {
	apiURL       string
	errorPageURL string
	secret       string
	originSecret string
	http         *http.Client
	mu           sync.RWMutex
	sessions     map[string]*yamux.Session
	routes       map[string]cachedRoute
}

type cachedRoute struct {
	value     route
	expiresAt time.Time
}

var upgrader = websocket.Upgrader{CheckOrigin: func(_ *http.Request) bool { return true }}

func main() {
	apiURL := strings.TrimRight(required("SERVLY_API_INTERNAL_URL"), "/")
	e := &edge{
		apiURL:       apiURL,
		errorPageURL: strings.TrimRight(env("SERVLY_ERROR_PAGE_BASE_URL", apiURL), "/"),
		secret:       required("NODE_GATEWAY_SHARED_SECRET"),
		originSecret: required("EDGE_ORIGIN_SHARED_SECRET"),
		http:         &http.Client{Timeout: 5 * time.Second},
		sessions:     map[string]*yamux.Session{},
		routes:       map[string]cachedRoute{},
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) { writeJSON(w, 200, map[string]any{"ok": true}) })
	mux.HandleFunc("/v1/agents/tunnel", e.connectTunnel)
	mux.HandleFunc("/", e.recoverHTTP(e.proxyHTTP))
	address := env("EDGE_ADDR", ":"+env("PORT", "8082"))
	server := &http.Server{Addr: address, Handler: mux, ReadHeaderTimeout: 10 * time.Second, MaxHeaderBytes: 64 << 10, IdleTimeout: 65 * time.Second}
	log.Printf("servly edge listening on %s", address)
	log.Fatal(server.ListenAndServe())
}

func (e *edge) connectTunnel(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	nonceBytes := make([]byte, 32)
	if _, err = rand.Read(nonceBytes); err != nil {
		conn.Close()
		return
	}
	nonce := base64.RawURLEncoding.EncodeToString(nonceBytes)
	if err = conn.WriteJSON(map[string]any{"version": protocolVersion, "type": "hello", "payload": map[string]any{"nonce": nonce}}); err != nil {
		conn.Close()
		return
	}
	conn.SetReadDeadline(time.Now().Add(15 * time.Second))
	var message struct {
		Version string `json:"version"`
		Type    string `json:"type"`
		Payload struct {
			CredentialID string `json:"credentialId"`
			Signature    string `json:"signature"`
		} `json:"payload"`
	}
	if conn.ReadJSON(&message) != nil || message.Version != protocolVersion || message.Type != "authenticate" {
		writeWSError(conn, "authentication_required")
		conn.Close()
		return
	}
	verified, err := e.verify(r.Context(), nonce, message.Payload.CredentialID, message.Payload.Signature)
	if err != nil {
		writeWSError(conn, "credential_rejected")
		conn.Close()
		return
	}
	if err = conn.WriteJSON(map[string]any{"version": protocolVersion, "type": "status", "payload": map[string]any{"authenticated": true, "nodeId": verified.NodeID}}); err != nil {
		conn.Close()
		return
	}
	conn.SetReadDeadline(time.Time{})
	transport := newWSConn(conn)
	session, err := yamux.Server(transport, nil)
	if err != nil {
		conn.Close()
		return
	}
	e.mu.Lock()
	previous := e.sessions[verified.NodeID]
	e.sessions[verified.NodeID] = session
	e.mu.Unlock()
	if previous != nil {
		_ = previous.Close()
	}
	_ = e.tunnelState(context.Background(), verified.NodeID, true)
	defer func() {
		removed := e.unregister(verified.NodeID, session)
		_ = session.Close()
		if removed {
			_ = e.tunnelState(context.Background(), verified.NodeID, false)
		}
	}()
	<-session.CloseChan()
}

func (e *edge) unregister(nodeID string, session *yamux.Session) bool {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.sessions[nodeID] != session {
		return false
	}
	delete(e.sessions, nodeID)
	return true
}

func (e *edge) proxyHTTP(w http.ResponseWriter, r *http.Request) {
	if !e.validOriginRequest(r) {
		e.writeServlyError(w, http.StatusForbidden, "403", requestHostname(r), "")
		return
	}
	hostname := requestHostname(r)
	resolved, err := e.resolve(r.Context(), hostname)
	if err != nil {
		if isAPIStatus(err, http.StatusNotFound) {
			e.writeServlyError(w, http.StatusServiceUnavailable, "service_unavailable", hostname, "This app may have been deleted, moved, or changed by its owner.")
		} else {
			e.writeServlyError(w, http.StatusServiceUnavailable, "503", hostname, "")
		}
		return
	}
	if !resolved.Available {
		e.writeServlyError(w, http.StatusServiceUnavailable, "503", hostname, "")
		return
	}
	e.mu.RLock()
	session := e.sessions[resolved.NodeID]
	e.mu.RUnlock()
	if session == nil || session.IsClosed() {
		e.writeServlyError(w, http.StatusServiceUnavailable, "503", hostname, "")
		return
	}
	stream, err := session.Open()
	if err != nil {
		e.writeServlyError(w, http.StatusServiceUnavailable, "503", hostname, "")
		return
	}
	defer stream.Close()
	_ = stream.SetDeadline(time.Now().Add(60 * time.Second))
	proxied := r.Clone(r.Context())
	proxied.RequestURI = ""
	proxied.Body = http.MaxBytesReader(w, r.Body, 25<<20)
	removeHopHeaders(proxied.Header)
	proxied.Header.Set("X-Servly-Workload-Id", resolved.WorkloadID)
	proxied.Header.Set("X-Servly-Local-Port", fmt.Sprint(resolved.LocalPort))
	proxied.Header.Set("X-Forwarded-Host", hostname)
	if err = proxied.Write(stream); err != nil {
		e.writeServlyError(w, http.StatusServiceUnavailable, "503", hostname, "")
		return
	}
	response, err := http.ReadResponse(bufio.NewReaderSize(stream, 64<<10), proxied)
	if err != nil {
		e.writeServlyError(w, http.StatusServiceUnavailable, "503", hostname, "")
		return
	}
	defer response.Body.Close()
	removeHopHeaders(response.Header)
	for key, values := range response.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	w.Header().Set("X-Servly-Upstream-Reached", "true")
	w.WriteHeader(response.StatusCode)
	_, _ = io.Copy(w, response.Body)
}

func (e *edge) validOriginRequest(r *http.Request) bool {
	provided := []byte(r.Header.Get("X-Servly-Origin-Secret"))
	expected := []byte(e.originSecret)
	return len(expected) > 0 && len(provided) == len(expected) && subtle.ConstantTimeCompare(provided, expected) == 1
}

func (e *edge) verify(ctx context.Context, nonce, credentialID, signature string) (identity, error) {
	var response struct {
		Success bool     `json:"success"`
		Data    identity `json:"data"`
	}
	err := e.post(ctx, "/internal/nodes/verify", map[string]string{
		"credentialId": credentialID, "nonce": nonce, "signature": signature,
	}, &response)
	if err != nil || !response.Success || response.Data.NodeID == "" {
		return identity{}, errors.New("verification failed")
	}
	return response.Data, nil
}

func (e *edge) resolve(ctx context.Context, hostname string) (route, error) {
	e.mu.RLock()
	cached, ok := e.routes[hostname]
	e.mu.RUnlock()
	if ok && time.Now().Before(cached.expiresAt) {
		return cached.value, nil
	}
	var response struct {
		Success bool  `json:"success"`
		Data    route `json:"data"`
	}
	err := e.get(ctx, "/internal/nodes/ingress/"+url.PathEscape(hostname), &response)
	if err != nil {
		return route{}, err
	}
	if !response.Success {
		return route{}, apiStatusError{status: http.StatusNotFound}
	}
	e.mu.Lock()
	e.routes[hostname] = cachedRoute{value: response.Data, expiresAt: time.Now().Add(5 * time.Second)}
	e.mu.Unlock()
	return response.Data, nil
}

func requestHostname(r *http.Request) string {
	hostname := strings.ToLower(strings.Split(r.Header.Get("X-Servly-Request-Host"), ":")[0])
	if hostname == "" {
		hostname = strings.ToLower(strings.Split(r.Host, ":")[0])
	}
	return hostname
}

func (e *edge) writeServlyError(w http.ResponseWriter, status int, kind, hostname, detail string) {
	pageURL, err := url.Parse(e.errorPageURL + "/servly/error/" + kind)
	if err == nil {
		query := pageURL.Query()
		query.Set("name", hostname)
		if detail != "" {
			query.Set("description", detail)
		}
		pageURL.RawQuery = query.Encode()
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store, max-age=0")
	w.Header().Set("X-Servly-Edge-Error", kind)
	if status == http.StatusServiceUnavailable {
		w.Header().Set("Retry-After", "30")
	}
	w.WriteHeader(status)
	_, _ = fmt.Fprintf(w, `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Servly</title><style>html,body,iframe{margin:0;width:100%%;height:100%%;border:0;background:#101010}body{overflow:hidden}</style></head><body><iframe src="%s" title="Servly status"></iframe></body></html>`, html.EscapeString(pageURL.String()))
}

func (e *edge) recoverHTTP(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				log.Printf("servly edge request panic: %v", recovered)
				e.writeServlyError(w, http.StatusInternalServerError, "500", requestHostname(r), "")
			}
		}()
		next(w, r)
	}
}

func (e *edge) tunnelState(ctx context.Context, nodeID string, connected bool) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	var ignored any
	return e.post(ctx, "/internal/nodes/"+nodeID+"/tunnel", map[string]bool{"connected": connected}, &ignored)
}

func (e *edge) get(ctx context.Context, path string, target any) error {
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, e.apiURL+path, nil)
	req.Header.Set("x-servly-gateway-secret", e.secret)
	return e.do(req, target)
}

func (e *edge) post(ctx context.Context, path string, body, target any) error {
	payload, _ := json.Marshal(body)
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, e.apiURL+path, bytes.NewReader(payload))
	req.Header.Set("content-type", "application/json")
	req.Header.Set("x-servly-gateway-secret", e.secret)
	return e.do(req, target)
}

func (e *edge) do(req *http.Request, target any) error {
	response, err := e.http.Do(req)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return apiStatusError{status: response.StatusCode}
	}
	return json.NewDecoder(response.Body).Decode(target)
}

type apiStatusError struct{ status int }

func (e apiStatusError) Error() string { return fmt.Sprintf("API returned %d", e.status) }

func isAPIStatus(err error, status int) bool {
	var responseError apiStatusError
	return errors.As(err, &responseError) && responseError.status == status
}

type wsConn struct {
	conn   *websocket.Conn
	mu     sync.Mutex
	reader io.Reader
}

func newWSConn(conn *websocket.Conn) net.Conn { return &wsConn{conn: conn} }
func (c *wsConn) Read(p []byte) (int, error) {
	for {
		if c.reader != nil {
			n, err := c.reader.Read(p)
			if !errors.Is(err, io.EOF) {
				return n, err
			}
			if n > 0 {
				return n, nil
			}
			c.reader = nil
		}
		messageType, reader, err := c.conn.NextReader()
		if err != nil {
			return 0, err
		}
		if messageType == websocket.BinaryMessage {
			c.reader = reader
		}
	}
}
func (c *wsConn) Write(p []byte) (int, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if err := c.conn.WriteMessage(websocket.BinaryMessage, p); err != nil {
		return 0, err
	}
	return len(p), nil
}
func (c *wsConn) Close() error         { return c.conn.Close() }
func (c *wsConn) LocalAddr() net.Addr  { return c.conn.LocalAddr() }
func (c *wsConn) RemoteAddr() net.Addr { return c.conn.RemoteAddr() }
func (c *wsConn) SetDeadline(t time.Time) error {
	_ = c.conn.SetReadDeadline(t)
	return c.conn.SetWriteDeadline(t)
}
func (c *wsConn) SetReadDeadline(t time.Time) error  { return c.conn.SetReadDeadline(t) }
func (c *wsConn) SetWriteDeadline(t time.Time) error { return c.conn.SetWriteDeadline(t) }

func removeHopHeaders(header http.Header) {
	for _, key := range []string{"Connection", "Proxy-Connection", "Keep-Alive", "Proxy-Authenticate", "Proxy-Authorization", "Te", "Trailer", "Transfer-Encoding", "Upgrade"} {
		header.Del(key)
	}
}

func writeWSError(conn *websocket.Conn, code string) {
	_ = conn.WriteJSON(map[string]any{"version": protocolVersion, "type": "error", "payload": map[string]string{"code": code}})
}
func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func required(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("%s is required", key)
	}
	return value
}
func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
