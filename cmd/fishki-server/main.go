package main

import (
	"embed"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/timhughes/fishki/internal/config"
	"github.com/timhughes/fishki/internal/handlers"
)

//go:embed web/build
var content embed.FS

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Set up handlers
	mux := http.NewServeMux()
	handlers.SetupHandlers(mux, cfg)

	// Serve the React frontend
	fs := http.FileServer(http.FS(content))
	mux.Handle("/", fs)

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Starting server on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
