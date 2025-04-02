package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	web "github.com/timhughes/fishki/frontend"
	"github.com/timhughes/fishki/internal/config"
	"github.com/timhughes/fishki/internal/handlers"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
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
		
		path := "dist" + r.URL.Path
		content, err := web.WebBuild.ReadFile(path)
		if err != nil {
			// Serve index.html for all other routes to support client-side routing
			content, err = web.WebBuild.ReadFile(path)
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



	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Starting server on port %s\n", port)
	log.Printf("Running in %s mode\n", os.Getenv("NODE_ENV"))
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
