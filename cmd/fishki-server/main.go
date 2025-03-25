package main

import (
"fmt"
"log"
"net/http"
"os"
"strings"

	"github.com/timhughes/fishki/internal/config"
	"github.com/timhughes/fishki/internal/handlers"
	"github.com/timhughes/fishki/web"
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
mux.Handle("/static/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    // Strip /static/ prefix and prepend build/ to access files from embedded filesystem
    path := "build" + r.URL.Path
    content, err := web.WebBuild.ReadFile(path)
    if err != nil {
        http.Error(w, "Static file not found", http.StatusNotFound)
        return
    }

    // Set content type based on file extension
    switch {
    case strings.HasSuffix(r.URL.Path, ".css"):
        w.Header().Set("Content-Type", "text/css")
    case strings.HasSuffix(r.URL.Path, ".js"):
        w.Header().Set("Content-Type", "application/javascript")
    }
    
    w.Write(content)
}))

// Serve index.html for all other routes to support client-side routing
mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    // Skip if path starts with /api
    if len(r.URL.Path) >= 4 && r.URL.Path[:4] == "/api" {
        return
    }
    
    // Serve index.html from the build directory
    indexFile, err := web.WebBuild.ReadFile("build/index.html")
    if err != nil {
        http.Error(w, "Could not read index.html", http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "text/html")
    w.Write(indexFile)
}))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Starting server on port %s\n", port)
	log.Printf("Running in %s mode\n", os.Getenv("NODE_ENV"))
log.Fatal(http.ListenAndServe(":"+port, mux))
}
