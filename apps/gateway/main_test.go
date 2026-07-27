package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestLoadGatewayEnvFileOverridesStaleDevelopmentSecret(t *testing.T) {
	t.Setenv("NODE_GATEWAY_SHARED_SECRET", "stale-shell-secret")
	path := filepath.Join(t.TempDir(), ".env")
	if err := os.WriteFile(path, []byte("NODE_GATEWAY_SHARED_SECRET=current-repository-secret\nIGNORED=value\n"), 0600); err != nil {
		t.Fatal(err)
	}
	if !loadGatewayEnvFile(path) {
		t.Fatal("expected development env file to load")
	}
	if got := os.Getenv("NODE_GATEWAY_SHARED_SECRET"); got != "current-repository-secret" {
		t.Fatalf("expected repository secret, got %q", got)
	}
	if got := os.Getenv("IGNORED"); got != "" {
		t.Fatalf("unexpected unrelated environment value %q", got)
	}
}

func TestLoadDevelopmentEnvDefaultsLocalAPIURL(t *testing.T) {
	t.Setenv("NODE_ENV", "development")
	t.Setenv("SERVLY_API_INTERNAL_URL", "")
	loadDevelopmentEnv()
	if got := os.Getenv("SERVLY_API_INTERNAL_URL"); got != "http://localhost:5001" {
		t.Fatalf("unexpected local API URL %q", got)
	}
}

func TestVerifyUsesAuthenticatedInternalAPI(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/internal/nodes/verify" {
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
		if r.Header.Get("x-servly-gateway-secret") != "shared" {
			t.Fatal("gateway secret was not sent")
		}
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "data": map[string]string{"credentialId": "cred", "nodeId": "node", "companyId": "company"}})
	}))
	defer server.Close()
	g := &gateway{apiURL: server.URL, secret: "shared", http: &http.Client{Timeout: time.Second}, nodes: map[string]*client{}}
	got, err := g.verify(context.Background(), "nonce", authPayload{CredentialID: "cred", Signature: "signature"})
	if err != nil {
		t.Fatal(err)
	}
	if got.NodeID != "node" || got.CompanyID != "company" {
		encoded, _ := json.Marshal(got)
		t.Fatalf("unexpected identity %s", encoded)
	}
}

func TestVerifyRejectsAPIFailure(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { http.Error(w, "revoked", http.StatusUnauthorized) }))
	defer server.Close()
	g := &gateway{apiURL: server.URL, secret: "shared", http: &http.Client{Timeout: time.Second}, nodes: map[string]*client{}}
	if _, err := g.verify(context.Background(), "nonce", authPayload{CredentialID: "revoked", Signature: "signature"}); err == nil {
		t.Fatal("expected verification to fail")
	}
}

func TestGatewayCodeForAPIErrorSeparatesCredentialAndAvailabilityFailures(t *testing.T) {
	if got := gatewayCodeForAPIError(&apiStatusError{status: http.StatusInternalServerError}); got != "gateway_unavailable" {
		t.Fatalf("unexpected infrastructure error code %q", got)
	}
	if got := gatewayCodeForAPIError(&apiStatusError{status: http.StatusUnauthorized}); got != "credential_rejected" {
		t.Fatalf("unexpected credential error code %q", got)
	}
}

func TestQueueHeartbeatCoalescesToNewestObservation(t *testing.T) {
	c := &client{syncing: true, pending: map[string]any{"revision": 1}}
	g := &gateway{}

	g.queueHeartbeat(c, map[string]any{"revision": 2, "runtimeStatus": "ready"})
	g.queueHeartbeat(c, map[string]any{"revision": 3, "runtimeStatus": "stopped"})

	if revision := c.pending["revision"]; revision != 3 {
		t.Fatalf("expected newest revision to remain pending, got %#v", c.pending)
	}
	if status := c.pending["runtimeStatus"]; status != "stopped" {
		t.Fatalf("expected newest status to remain pending, got %#v", c.pending)
	}
}
