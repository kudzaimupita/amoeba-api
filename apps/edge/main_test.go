package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/hashicorp/yamux"
)

func TestResolveUsesShortLivedRouteCache(t *testing.T) {
	var requests atomic.Int32
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		if r.Header.Get("x-servly-gateway-secret") != "test-secret" {
			t.Fatal("internal secret was not forwarded")
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"data":    map[string]any{"hostname": "node-test.servly.app", "nodeId": "node", "workloadId": "workload", "localPort": 8080, "available": true},
		})
	}))
	defer api.Close()
	e := &edge{apiURL: api.URL, secret: "test-secret", http: api.Client(), sessions: map[string]*yamux.Session{}, routes: map[string]cachedRoute{}}
	for i := 0; i < 2; i++ {
		if _, err := e.resolve(context.Background(), "node-test.servly.app"); err != nil {
			t.Fatal(err)
		}
	}
	if requests.Load() != 1 {
		t.Fatalf("expected one API lookup, got %d", requests.Load())
	}
}

func TestUnavailablePageIsBrandedAndNotCached(t *testing.T) {
	recorder := httptest.NewRecorder()
	e := &edge{errorPageURL: "https://api.servly.test"}
	e.writeServlyError(recorder, http.StatusServiceUnavailable, "503", "node-test.servly.app", "")
	if recorder.Code != http.StatusServiceUnavailable || recorder.Header().Get("Cache-Control") != "no-store, max-age=0" {
		t.Fatalf("unexpected response status=%d cache=%q", recorder.Code, recorder.Header().Get("Cache-Control"))
	}
	if !strings.Contains(recorder.Body.String(), "https://api.servly.test/servly/error/503?name=node-test.servly.app") {
		t.Fatal("unavailable page is missing Servly branding")
	}
	if recorder.Header().Get("Retry-After") != "30" || recorder.Header().Get("X-Servly-Edge-Error") != "503" {
		t.Fatal("temporary error response is missing edge metadata")
	}
}

func TestAPIStatusErrorsRemainClassifiable(t *testing.T) {
	if !isAPIStatus(apiStatusError{status: http.StatusNotFound}, http.StatusNotFound) {
		t.Fatal("expected API status error to retain its response code")
	}
}

func TestResolvePreservesNotFoundStatus(t *testing.T) {
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "missing", http.StatusNotFound)
	}))
	defer api.Close()
	e := &edge{apiURL: api.URL, secret: "test-secret", http: api.Client(), sessions: map[string]*yamux.Session{}, routes: map[string]cachedRoute{}}
	_, err := e.resolve(context.Background(), "retired.servly.app")
	if !isAPIStatus(err, http.StatusNotFound) {
		t.Fatalf("expected a classified not-found error, got %v", err)
	}
}

func TestRemoveHopHeaders(t *testing.T) {
	header := http.Header{"Connection": {"upgrade"}, "Upgrade": {"websocket"}, "X-Test": {"kept"}}
	removeHopHeaders(header)
	if header.Get("Connection") != "" || header.Get("Upgrade") != "" || header.Get("X-Test") != "kept" {
		t.Fatalf("unexpected filtered headers %#v", header)
	}
}

func TestOriginRequestRequiresSharedSecret(t *testing.T) {
	e := &edge{originSecret: "edge-secret"}
	request := httptest.NewRequest(http.MethodGet, "https://edge.example.test", nil)
	if e.validOriginRequest(request) {
		t.Fatal("request without the origin secret was accepted")
	}
	request.Header.Set("X-Servly-Origin-Secret", "edge-secret")
	if !e.validOriginRequest(request) {
		t.Fatal("request with the origin secret was rejected")
	}
}

func TestOlderTunnelCannotRemoveNewestSession(t *testing.T) {
	oldSession := new(yamux.Session)
	newSession := new(yamux.Session)
	e := &edge{sessions: map[string]*yamux.Session{"node": newSession}}
	if e.unregister("node", oldSession) {
		t.Fatal("older session removed the active tunnel")
	}
	if e.sessions["node"] != newSession || !e.unregister("node", newSession) {
		t.Fatal("newest session was not removed cleanly")
	}
}
