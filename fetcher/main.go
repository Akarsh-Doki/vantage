// The Vantage URL fetcher: the only component allowed to fetch
// user-supplied URLs. SSRF protection lives here (see CLAUDE.md rule 4).
package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"time"
)

const maxBytes = 2_000_000

// Test seams — main_test.go swaps these for hermetic DNS and a short
// timeout; production always runs with these defaults.
var (
	timeout   = 5 * time.Second
	lookupIP  = net.DefaultResolver.LookupIP
	ipAllowed = isPublic
)

type req struct {
	URL string `json:"url"`
}

type resp struct {
	Content  string `json:"content"`
	FinalURL string `json:"final_url"`
	Status   int    `json:"status"`
}

func isPublic(ip net.IP) bool {
	return !(ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast() || ip.IsUnspecified())
}

// safeDial resolves the host itself and dials the vetted IP directly, so a
// DNS answer pointing at an internal address can never be connected to.
func safeDial(ctx context.Context, network, addr string) (net.Conn, error) {
	host, port, err := net.SplitHostPort(addr)
	if err != nil {
		return nil, err
	}
	ips, err := lookupIP(ctx, "ip", host)
	if err != nil {
		return nil, err
	}
	for _, ip := range ips {
		if !ipAllowed(ip) {
			return nil, &net.AddrError{Err: "blocked non-public address", Addr: ip.String()}
		}
	}
	return (&net.Dialer{Timeout: timeout}).DialContext(ctx, network, net.JoinHostPort(ips[0].String(), port))
}

func fetch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	var in req
	if json.NewDecoder(r.Body).Decode(&in) != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	u, err := url.Parse(in.URL)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		http.Error(w, "http/https only", http.StatusBadRequest)
		return
	}
	client := &http.Client{Timeout: timeout, Transport: &http.Transport{DialContext: safeDial}}
	res, err := client.Get(u.String())
	if err != nil {
		http.Error(w, "fetch blocked or failed", http.StatusBadGateway)
		return
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(res.Body, maxBytes))
	json.NewEncoder(w).Encode(resp{string(body), res.Request.URL.String(), res.StatusCode})
}

// selfCheck probes /health on the local server; the distroless image has no
// shell or curl, so `fetcher healthcheck` is the Docker HEALTHCHECK command.
func selfCheck(port string) {
	res, err := (&http.Client{Timeout: 2 * time.Second}).Get("http://127.0.0.1:" + port + "/health")
	if err != nil {
		os.Exit(1)
	}
	res.Body.Close()
	if res.StatusCode != http.StatusOK {
		os.Exit(1)
	}
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		selfCheck(port)
		return
	}
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })
	http.HandleFunc("/fetch", fetch)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
