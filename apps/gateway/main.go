package main

import (
	"bufio"
	"bytes"
	"context"
	cryptorand "crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	mathrand "math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const protocolVersion = "1"

type envelope struct {
	Version string          `json:"version"`
	Type    string          `json:"type"`
	ID      string          `json:"id,omitempty"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

type authPayload struct {
	CredentialID string `json:"credentialId"`
	Signature    string `json:"signature"`
}

type identity struct {
	CredentialID string `json:"credentialId"`
	NodeID       string `json:"nodeId"`
	CompanyID    string `json:"companyId"`
}

type client struct {
	conn       *websocket.Conn
	identity   identity
	lastSeen   time.Time
	disconnect sync.Once
	writeMu    sync.Mutex
	stateMu    sync.Mutex
	lastPong   time.Time
	syncMu     sync.Mutex
	pending    map[string]any
	syncing    bool
	done       chan struct{}
}

type desiredStatePayload struct {
	NodeID             string         `json:"nodeId"`
	Name               string         `json:"name"`
	AvailabilityStatus string         `json:"availabilityStatus"`
	Capacity           map[string]any `json:"capacity"`
	Allocated          map[string]any `json:"allocated,omitempty"`
	Capabilities       map[string]any `json:"capabilities"`
	DesiredRevision    int            `json:"desiredRevision"`
	UpdatedAt          string         `json:"updatedAt,omitempty"`
}

type nodeStateResponse struct {
	Success bool `json:"success"`
	Data    struct {
		NodeID       string              `json:"nodeId"`
		DesiredState desiredStatePayload `json:"desiredState"`
		Commands     []nodeCommand       `json:"commands"`
	} `json:"data"`
}

type nodeCommand struct {
	ID      string         `json:"id"`
	Kind    string         `json:"kind"`
	Payload map[string]any `json:"payload"`
}

type gateway struct {
	apiURL string
	secret string
	http   *http.Client
	mu     sync.Mutex
	nodes  map[string]*client
}

type apiStatusError struct {
	status int
}

func (e *apiStatusError) Error() string { return fmt.Sprintf("api returned %d", e.status) }

func gatewayCodeForAPIError(err error) string {
	var statusError *apiStatusError
	if errors.As(err, &statusError) && (statusError.status == http.StatusUnauthorized || statusError.status == http.StatusForbidden || statusError.status == http.StatusNotFound) {
		return "credential_rejected"
	}
	return "gateway_unavailable"
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(_ *http.Request) bool { return true }, // Agents authenticate cryptographically after upgrade.
}

func main() {
	loadDevelopmentEnv()
	g := &gateway{
		apiURL: strings.TrimRight(required("SERVLY_API_INTERNAL_URL"), "/"),
		secret: required("NODE_GATEWAY_SHARED_SECRET"),
		http:   &http.Client{Timeout: 5 * time.Second},
		nodes:  map[string]*client{},
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) { writeJSON(w, http.StatusOK, map[string]any{"ok": true}) })
	mux.HandleFunc("/v1/agents/connect", g.connect)
	mux.HandleFunc("/internal/disconnect", g.disconnectNode)
	mux.HandleFunc("/internal/sync", g.syncNode)
	mux.HandleFunc("/internal/command", g.sendCommand)
	addr := env("GATEWAY_ADDR", ":8081")
	log.Printf("servly gateway listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

// The TypeScript API loads the repository .env during local development. Load
// the same file here so `go run .` and `npm run dev:gateway` cannot start with
// different inherited gateway secrets. Production continues to use injected
// task environment variables only.
func loadDevelopmentEnv() {
	if os.Getenv("NODE_ENV") == "production" {
		return
	}
	for _, candidate := range []string{".env", filepath.Join("..", "..", ".env")} {
		if loadGatewayEnvFile(candidate) {
			break
		}
	}
	if os.Getenv("SERVLY_API_INTERNAL_URL") == "" {
		_ = os.Setenv("SERVLY_API_INTERNAL_URL", "http://localhost:5001")
	}
}

func loadGatewayEnvFile(path string) bool {
	file, err := os.Open(path)
	if err != nil {
		return false
	}
	defer file.Close()
	allowed := map[string]bool{
		"NODE_GATEWAY_SHARED_SECRET": true,
		"SERVLY_API_INTERNAL_URL":    true,
		"GATEWAY_ADDR":               true,
	}
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		line = strings.TrimPrefix(line, "export ")
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		if !allowed[key] {
			continue
		}
		value := strings.TrimSpace(parts[1])
		if len(value) >= 2 && ((value[0] == '"' && value[len(value)-1] == '"') || (value[0] == '\'' && value[len(value)-1] == '\'')) {
			value = value[1 : len(value)-1]
		}
		_ = os.Setenv(key, value)
	}
	return scanner.Err() == nil
}

func (g *gateway) connect(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	nonceBytes := make([]byte, 32)
	if _, err = cryptorand.Read(nonceBytes); err != nil {
		conn.Close()
		return
	}
	nonce := base64.RawURLEncoding.EncodeToString(nonceBytes)
	if err = conn.WriteJSON(map[string]any{
		"version": protocolVersion,
		"type":    "hello",
		"payload": map[string]any{"nonce": nonce, "heartbeatSeconds": 30, "pingSeconds": 15, "livenessSeconds": 45},
	}); err != nil {
		conn.Close()
		return
	}

	conn.SetReadDeadline(time.Now().Add(15 * time.Second))
	var message envelope
	if err = conn.ReadJSON(&message); err != nil || message.Version != protocolVersion || message.Type != "authenticate" {
		writeError(conn, "authentication_required", "Expected a version 1 authenticate message")
		conn.Close()
		return
	}
	var auth authPayload
	if json.Unmarshal(message.Payload, &auth) != nil || auth.CredentialID == "" || auth.Signature == "" {
		writeError(conn, "invalid_authentication", "Credential and signature are required")
		conn.Close()
		return
	}
	identity, err := g.verify(r.Context(), nonce, auth)
	if err != nil {
		writeError(conn, "credential_rejected", "Device credential was rejected")
		conn.Close()
		return
	}
	c := &client{conn: conn, identity: identity, lastSeen: time.Now(), lastPong: time.Now(), done: make(chan struct{})}
	g.register(c)
	defer g.remove(c)
	conn.SetReadDeadline(time.Now().Add(45 * time.Second))
	conn.SetPongHandler(func(string) error {
		c.touchPong()
		return conn.SetReadDeadline(time.Now().Add(45 * time.Second))
	})
	_ = c.writeJSON(map[string]any{"version": protocolVersion, "type": "status", "payload": map[string]any{
		"authenticated": true, "nodeId": identity.NodeID, "synchronization": map[string]any{"status": "pending"},
	}})
	go g.syncConnected(c)
	go c.transportLoop()

	for {
		var incoming envelope
		if err = conn.ReadJSON(&incoming); err != nil {
			return
		}
		// Application heartbeats are the liveness signal for agents. Renew the
		// socket deadline for every valid inbound envelope so a healthy agent is
		// not disconnected 90 seconds after authentication.
		conn.SetReadDeadline(time.Now().Add(45 * time.Second))
		if incoming.Version != protocolVersion {
			_ = c.writeError("protocol_unsupported", "Unsupported protocol version")
			continue
		}
		switch incoming.Type {
		case "heartbeat", "status":
			c.lastSeen = time.Now()
			status := map[string]any{}
			if len(incoming.Payload) > 0 {
				_ = json.Unmarshal(incoming.Payload, &status)
			}
			_ = c.writeJSON(map[string]any{"version": protocolVersion, "type": "result", "id": incoming.ID, "payload": map[string]any{
				"accepted": true, "heartbeatId": incoming.ID, "serverTime": time.Now().UTC(),
			}})
			g.queueHeartbeat(c, status)
		case "result":
			result := map[string]any{}
			if len(incoming.Payload) > 0 {
				_ = json.Unmarshal(incoming.Payload, &result)
			}
			go func(commandID string, commandResult map[string]any) {
				ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				defer cancel()
				var ignored any
				_ = g.api(ctx, fmt.Sprintf("/internal/nodes/%s/commands/result", identity.NodeID), map[string]any{
					"commandId": commandID,
					"result":    commandResult,
				}, &ignored)
			}(incoming.ID, result)
		default:
			_ = c.writeError("unsupported_message", "Message type is not supported")
		}
	}
}

func (c *client) touchPong() {
	c.stateMu.Lock()
	c.lastPong = time.Now()
	c.stateMu.Unlock()
}

func (c *client) lastPongAt() time.Time {
	c.stateMu.Lock()
	defer c.stateMu.Unlock()
	return c.lastPong
}

func (c *client) transportLoop() {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-c.done:
			return
		case now := <-ticker.C:
			if now.Sub(c.lastPongAt()) >= 45*time.Second {
				c.close(websocket.CloseGoingAway, "heartbeat_timeout")
				return
			}
			if err := c.writeControl(websocket.PingMessage, []byte(fmt.Sprintf("%d", now.UnixMilli()))); err != nil {
				c.close(websocket.CloseGoingAway, "connect_timeout")
				return
			}
		}
	}
}

func (g *gateway) syncConnected(c *client) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var response nodeStateResponse
	err := g.api(ctx, fmt.Sprintf("/internal/nodes/%s/connected", c.identity.NodeID), map[string]any{}, &response)
	if err != nil {
		if gatewayCodeForAPIError(err) == "credential_rejected" {
			_ = c.writeError("credential_rejected", "Device credential was rejected")
			c.close(websocket.ClosePolicyViolation, "credential_rejected")
			return
		}
		_ = c.writeSynchronization("degraded", "api_sync_degraded", desiredStatePayload{})
		return
	}
	_ = c.writeSynchronization("healthy", "", response.Data.DesiredState)
	g.deliverCommands(c, response.Data.Commands)
}

func (g *gateway) queueHeartbeat(c *client, status map[string]any) {
	c.syncMu.Lock()
	c.pending = status
	if c.syncing {
		c.syncMu.Unlock()
		return
	}
	c.syncing = true
	c.syncMu.Unlock()
	go g.syncHeartbeats(c)
}

func (g *gateway) syncHeartbeats(c *client) {
	attempt := 0
	for {
		c.syncMu.Lock()
		status := c.pending
		c.pending = nil
		if status == nil {
			c.syncing = false
			c.syncMu.Unlock()
			return
		}
		c.syncMu.Unlock()

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		var response nodeStateResponse
		err := g.api(ctx, fmt.Sprintf("/internal/nodes/%s/heartbeat", c.identity.NodeID), status, &response)
		cancel()
		if err == nil {
			attempt = 0
			_ = c.writeSynchronization("healthy", "", response.Data.DesiredState)
			g.deliverCommands(c, response.Data.Commands)
			continue
		}
		if gatewayCodeForAPIError(err) == "credential_rejected" {
			_ = c.writeError("credential_rejected", "Heartbeat credential was rejected")
			c.close(websocket.ClosePolicyViolation, "credential_rejected")
			return
		}
		_ = c.writeSynchronization("degraded", "api_sync_degraded", desiredStatePayload{})
		c.syncMu.Lock()
		if c.pending == nil {
			c.pending = status
		}
		c.syncMu.Unlock()
		attempt++
		maximum := 250 * time.Millisecond * time.Duration(1<<min(attempt, 6))
		if maximum > 15*time.Second {
			maximum = 15 * time.Second
		}
		delay := time.Duration(mathrand.Int63n(maximum.Milliseconds()+1)) * time.Millisecond
		select {
		case <-c.done:
			return
		case <-time.After(delay):
		}
	}
}

func (c *client) writeSynchronization(status, reason string, desired desiredStatePayload) error {
	payload := map[string]any{
		"authenticated": true,
		"nodeId":        c.identity.NodeID,
		"synchronization": map[string]any{
			"status": status,
		},
	}
	if reason != "" {
		payload["synchronization"].(map[string]any)["reason"] = reason
	}
	if desired.NodeID != "" {
		payload["desiredState"] = desired
	}
	return c.writeJSON(map[string]any{"version": protocolVersion, "type": "status", "payload": payload})
}

func (g *gateway) deliverCommands(c *client, commands []nodeCommand) bool {
	delivered := false
	for _, command := range commands {
		if command.ID == "" || command.Kind == "" {
			continue
		}
		payload := map[string]any{"kind": command.Kind}
		for key, value := range command.Payload {
			payload[key] = value
		}
		if err := c.writeJSON(map[string]any{
			"version": protocolVersion,
			"type":    "command",
			"id":      command.ID,
			"payload": payload,
		}); err != nil {
			return false
		}
		delivered = true
	}
	return delivered
}

func (g *gateway) verify(ctx context.Context, nonce string, auth authPayload) (identity, error) {
	var response struct {
		Success bool     `json:"success"`
		Data    identity `json:"data"`
	}
	err := g.api(ctx, "/internal/nodes/verify", map[string]string{"credentialId": auth.CredentialID, "nonce": nonce, "signature": auth.Signature}, &response)
	if err != nil || !response.Success || response.Data.NodeID == "" {
		return identity{}, errors.New("verification failed")
	}
	return response.Data, nil
}

func (g *gateway) register(c *client) {
	g.mu.Lock()
	previous := g.nodes[c.identity.NodeID]
	g.nodes[c.identity.NodeID] = c
	g.mu.Unlock()
	if previous != nil && previous != c {
		previous.close(websocket.ClosePolicyViolation, "superseded by a newer connection")
	}
}

func (g *gateway) remove(c *client) {
	g.mu.Lock()
	wasCurrent := g.nodes[c.identity.NodeID] == c
	if wasCurrent {
		delete(g.nodes, c.identity.NodeID)
	}
	g.mu.Unlock()
	c.close(websocket.CloseNormalClosure, "connection closed")
	if !wasCurrent {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = g.api(ctx, fmt.Sprintf("/internal/nodes/%s/disconnected", c.identity.NodeID), map[string]any{}, nil)
}

func (c *client) close(code int, reason string) {
	c.disconnect.Do(func() {
		close(c.done)
		_ = c.writeControl(websocket.CloseMessage, websocket.FormatCloseMessage(code, reason))
		_ = c.conn.Close()
	})
}

func (c *client) writeJSON(value any) error {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	return c.conn.WriteJSON(value)
}

func (c *client) writeControl(messageType int, value []byte) error {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	return c.conn.WriteControl(messageType, value, time.Now().Add(time.Second))
}

func (c *client) writeError(code, message string) error {
	return c.writeJSON(map[string]any{
		"version": protocolVersion,
		"type":    "error",
		"payload": map[string]string{"code": code, "message": message},
	})
}

func (g *gateway) disconnectNode(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("x-servly-gateway-secret") != g.secret {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var body struct {
		NodeID string `json:"nodeId"`
	}
	if json.NewDecoder(r.Body).Decode(&body) != nil || body.NodeID == "" {
		http.Error(w, "nodeId required", http.StatusBadRequest)
		return
	}
	g.mu.Lock()
	c := g.nodes[body.NodeID]
	g.mu.Unlock()
	if c != nil {
		c.close(websocket.ClosePolicyViolation, "credential_rejected")
	}
	writeJSON(w, http.StatusOK, map[string]any{"disconnected": c != nil})
}

func (g *gateway) syncNode(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("x-servly-gateway-secret") != g.secret {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var body struct {
		NodeID       string              `json:"nodeId"`
		DesiredState desiredStatePayload `json:"desiredState"`
	}
	if json.NewDecoder(r.Body).Decode(&body) != nil || body.NodeID == "" {
		http.Error(w, "nodeId and desiredState are required", http.StatusBadRequest)
		return
	}
	g.mu.Lock()
	c := g.nodes[body.NodeID]
	g.mu.Unlock()
	delivered := false
	if c != nil {
		delivered = c.writeJSON(map[string]any{
			"version": protocolVersion,
			"type":    "command",
			"id":      fmt.Sprintf("desired-%d", body.DesiredState.DesiredRevision),
			"payload": map[string]any{"kind": "desired_state", "desiredState": body.DesiredState},
		}) == nil
	}
	writeJSON(w, http.StatusOK, map[string]any{"delivered": delivered})
}

func (g *gateway) sendCommand(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("x-servly-gateway-secret") != g.secret {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var body struct {
		NodeID  string      `json:"nodeId"`
		Command nodeCommand `json:"command"`
	}
	if json.NewDecoder(r.Body).Decode(&body) != nil || body.NodeID == "" || body.Command.ID == "" || body.Command.Kind == "" {
		http.Error(w, "nodeId and command are required", http.StatusBadRequest)
		return
	}
	g.mu.Lock()
	c := g.nodes[body.NodeID]
	g.mu.Unlock()
	delivered := false
	if c != nil {
		delivered = g.deliverCommands(c, []nodeCommand{body.Command})
	}
	writeJSON(w, http.StatusOK, map[string]any{"delivered": delivered})
}

func (g *gateway) api(ctx context.Context, path string, body any, target any) error {
	payload, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, g.apiURL+path, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("content-type", "application/json")
	req.Header.Set("x-servly-gateway-secret", g.secret)
	res, err := g.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return &apiStatusError{status: res.StatusCode}
	}
	if target != nil {
		return json.NewDecoder(res.Body).Decode(target)
	}
	return nil
}

func writeError(conn *websocket.Conn, code, message string) {
	_ = conn.WriteJSON(map[string]any{"version": protocolVersion, "type": "error", "payload": map[string]string{"code": code, "message": message}})
}
func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
func required(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("%s is required", key)
	}
	return value
}
