package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"
)

// stubDNS makes name resolution hermetic: IP literals resolve to themselves,
// names resolve via the given table, and everything else is NXDOMAIN. No
// test ever touches real DNS.
func stubDNS(t *testing.T, hosts map[string]string) {
	t.Helper()
	orig := lookupIP
	lookupIP = func(_ context.Context, _, host string) ([]net.IP, error) {
		if ip := net.ParseIP(host); ip != nil {
			return []net.IP{ip}, nil
		}
		if addr, ok := hosts[host]; ok {
			return []net.IP{net.ParseIP(addr)}, nil
		}
		return nil, &net.DNSError{Err: "no such host", Name: host, IsNotFound: true}
	}
	t.Cleanup(func() { lookupIP = orig })
}

// routeAsPublic points name at srv and exempts srv's address from the
// public-IP check (httptest can only listen on loopback, which the real
// check rightly blocks). Returns the URL the fetcher should be asked for.
func routeAsPublic(t *testing.T, srv *httptest.Server, name string) string {
	t.Helper()
	u, err := url.Parse(srv.URL)
	if err != nil {
		t.Fatal(err)
	}
	srvIP := net.ParseIP(u.Hostname())
	stubDNS(t, map[string]string{name: u.Hostname()})
	orig := ipAllowed
	ipAllowed = func(ip net.IP) bool { return ip.Equal(srvIP) || orig(ip) }
	t.Cleanup(func() { ipAllowed = orig })
	return "http://" + net.JoinHostPort(name, u.Port()) + "/"
}

func postFetch(t *testing.T, target string) *httptest.ResponseRecorder {
	t.Helper()
	body := strings.NewReader(fmt.Sprintf(`{"url":%q}`, target))
	r := httptest.NewRequest(http.MethodPost, "/fetch", body)
	w := httptest.NewRecorder()
	fetch(w, r)
	return w
}

func decodeResp(t *testing.T, w *httptest.ResponseRecorder) resp {
	t.Helper()
	var out resp
	if err := json.Unmarshal(w.Body.Bytes(), &out); err != nil {
		t.Fatalf("response is not valid resp JSON: %v; body: %.200s", err, w.Body)
	}
	return out
}

func TestFetchRejectsUnsafeURLs(t *testing.T) {
	stubDNS(t, map[string]string{"internal.corp.test": "10.0.0.5"})

	tests := []struct {
		name     string
		url      string
		wantCode int
	}{
		{"file scheme", "file:///etc/passwd", http.StatusBadRequest},
		{"ftp scheme", "ftp://example.com/pub", http.StatusBadRequest},
		{"gopher scheme", "gopher://example.com:70/1", http.StatusBadRequest},
		{"no scheme", "example.com/page", http.StatusBadRequest},
		{"ipv4 loopback", "http://127.0.0.1/admin", http.StatusBadGateway},
		{"ipv6 loopback", "http://[::1]/admin", http.StatusBadGateway},
		{"link-local metadata endpoint", "http://169.254.169.254/latest/meta-data/", http.StatusBadGateway},
		{"hostname resolving to private IP", "http://internal.corp.test/secrets", http.StatusBadGateway},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if w := postFetch(t, tt.url); w.Code != tt.wantCode {
				t.Errorf("POST /fetch %q: status = %d, want %d; body: %.200s",
					tt.url, w.Code, tt.wantCode, w.Body)
			}
		})
	}
}

func TestFetchAcceptsPublicURL(t *testing.T) {
	const page = "<html>public content</html>"
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, page)
	}))
	defer srv.Close()
	target := routeAsPublic(t, srv, "public.example.test")

	w := postFetch(t, target)
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %.200s", w.Code, w.Body)
	}
	out := decodeResp(t, w)
	if out.Content != page {
		t.Errorf("content = %q, want %q", out.Content, page)
	}
	if out.Status != http.StatusOK {
		t.Errorf("upstream status = %d, want 200", out.Status)
	}
	if out.FinalURL != target {
		t.Errorf("final_url = %q, want %q", out.FinalURL, target)
	}
}

func TestFetchEnforcesSizeLimit(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write(bytes.Repeat([]byte("a"), maxBytes+4096))
	}))
	defer srv.Close()
	target := routeAsPublic(t, srv, "big.example.test")

	w := postFetch(t, target)
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %.200s", w.Code, w.Body)
	}
	if got := len(decodeResp(t, w).Content); got != maxBytes {
		t.Errorf("content length = %d, want truncation at maxBytes = %d", got, maxBytes)
	}
}

func TestFetchEnforcesTimeout(t *testing.T) {
	orig := timeout
	timeout = 100 * time.Millisecond
	t.Cleanup(func() { timeout = orig })

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		select {
		case <-r.Context().Done(): // client gave up — return so srv.Close() doesn't hang
		case <-time.After(5 * time.Second):
		}
	}))
	defer srv.Close()
	target := routeAsPublic(t, srv, "slow.example.test")

	start := time.Now()
	w := postFetch(t, target)
	elapsed := time.Since(start)
	if w.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502; body: %.200s", w.Code, w.Body)
	}
	if elapsed > 2*time.Second {
		t.Errorf("handler returned after %v; timeout of %v did not fire", elapsed, timeout)
	}
}
