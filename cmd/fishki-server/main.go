package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	web "github.com/timhughes/fishki/frontend"
	"github.com/timhughes/fishki/internal/config"
	"github.com/timhughes/fishki/internal/handlers"
)

// setupServer initializes and configures the HTTP server
func setupServer() (*http.ServeMux, error, *config.Config) {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load config: %v", err), nil
	}

	// Set up handlers
	mux := http.NewServeMux()
	handlers.SetupHandlers(mux, cfg)

	// Serve static files from the build directory
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip API routes
		if len(r.URL.Path) >= 4 && r.URL.Path[:4] == "/api" {
			return
		}
		if r.URL.Path == "/" {
			r.URL.Path = "/index.html"
		}

		// In test environment, don't try to serve files
		if web.IsTestEnvironment() {
			w.Header().Set("Content-Type", "text/html")
			w.Write([]byte("<html><body>Test Environment</body></html>"))
			return
		}

		path := "dist" + r.URL.Path
		content, err := web.WebBuild.ReadFile(path)
		if err != nil {
			// Serve index.html for all other routes to support client-side routing
			content, err = web.WebBuild.ReadFile("dist/index.html")
			if err != nil {
				http.Error(w, "Could not read index.html", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "text/html")
		}

		// Set content type based on file extension
		switch {
		case strings.HasSuffix(r.URL.Path, ".css"):
			w.Header().Set("Content-Type", "text/css")
		case strings.HasSuffix(r.URL.Path, ".js"):
			w.Header().Set("Content-Type", "application/javascript")
		case strings.HasSuffix(r.URL.Path, ".html"):
			w.Header().Set("Content-Type", "text/html")
		case strings.HasSuffix(r.URL.Path, ".png"):
			w.Header().Set("Content-Type", "image/png")
		case strings.HasSuffix(r.URL.Path, ".jpg"):
			w.Header().Set("Content-Type", "image/jpeg")
		case strings.HasSuffix(r.URL.Path, ".svg"):
			w.Header().Set("Content-Type", "image/svg+xml")
		}

		w.Write(content)
	}))

	return mux, nil, cfg
}

func main() {
	// Parse command line flags first, before any config loading
	bind := flag.String("bind", "localhost", "Bind address")
	port := flag.String("port", "8080", "Port to listen on")
	flag.Parse()

	// Allow PORT env var to override flag for backward compatibility
	if envPort := os.Getenv("PORT"); envPort != "" {
		*port = envPort
	}

	// Set up server after flags are parsed
	mux, err, cfg := setupServer()
	if err != nil {
		log.Fatalf("Failed to setup server: %v", err)
	}

	// Get config file path
	configPath, err := config.GetConfigPath()
	if err != nil {
		log.Printf("Warning: Could not determine config path: %v", err)
	}

	// Print startup information
	addr := fmt.Sprintf("%s:%s", *bind, *port)
	log.Printf("Server starting on http://%s (mode: %s)", addr, os.Getenv("NODE_ENV"))
	log.Printf("Configuration file: %s", configPath)
	
	if cfg.WikiPath == "" {
		log.Printf("Wiki path: Not configured yet. Please set up the wiki through the web interface.")
	} else {
		absPath, err := filepath.Abs(cfg.WikiPath)
		if err != nil {
			log.Printf("Wiki path: %s", cfg.WikiPath)
		} else {
			log.Printf("Wiki path: %s", absPath)
		}
		
		// Check if the wiki path exists
		if _, err := os.Stat(cfg.WikiPath); os.IsNotExist(err) {
			log.Printf("Warning: Wiki path does not exist. It will be created when needed.")
		}
	}
	
	log.Fatal(http.ListenAndServe(addr, mux))
}
