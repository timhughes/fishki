package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/timhughes/fishki/internal/config"
	"github.com/timhughes/fishki/internal/git"
	"github.com/timhughes/fishki/internal/markdown"
)

type Handler struct {
	config *config.Config
	git    git.GitClient
}

func NewHandler(cfg *config.Config) *Handler {
	return &Handler{
		config: cfg,
	}
}

func (h *Handler) SetGitClient(client git.GitClient) {
	h.git = client
}

func SetupHandlers(mux *http.ServeMux, cfg *config.Config) {
	h := NewHandler(cfg)
	
	// Initialize Git client
	h.SetGitClient(git.New())

	// Create a rate limiter for API endpoints (100 requests per minute)
	rateLimiter := NewRateLimiter(60*time.Second, 100)

	// Add security middleware
	securityChain := func(handler http.Handler) http.Handler {
		return AccessLoggerMiddleware(
			SecurityHeadersMiddleware(
				RateLimitMiddleware(rateLimiter)(
					handler,
				),
			),
		)
	}

	// Add CSRF protection for state-changing operations
	writeSecurityChain := func(handler http.Handler) http.Handler {
		return AccessLoggerMiddleware(
			SecurityHeadersMiddleware(
				RateLimitMiddleware(rateLimiter)(
					CSRFMiddleware(
						handler,
					),
				),
			),
		)
	}

	// Set up API routes
	mux.Handle("/api/files", securityChain(http.HandlerFunc(h.handleFiles)))
	mux.Handle("/api/load", securityChain(http.HandlerFunc(h.loadHandler())))
	mux.Handle("/api/save", writeSecurityChain(http.HandlerFunc(h.saveHandler())))
	mux.Handle("/api/delete", writeSecurityChain(http.HandlerFunc(h.deleteHandler())))
	mux.Handle("/api/render", securityChain(http.HandlerFunc(h.renderHandler())))
	mux.Handle("/api/init", writeSecurityChain(http.HandlerFunc(h.initHandler())))
	mux.Handle("/api/pull", writeSecurityChain(http.HandlerFunc(h.pullHandler())))
	mux.Handle("/api/push", writeSecurityChain(http.HandlerFunc(h.pushHandler())))
	mux.Handle("/api/fetch", writeSecurityChain(http.HandlerFunc(h.fetchHandler())))
	mux.Handle("/api/status", securityChain(http.HandlerFunc(h.statusHandler())))
	mux.Handle("/api/config", securityChain(http.HandlerFunc(h.configHandler())))
	mux.Handle("/api/csrf-token", securityChain(http.HandlerFunc(CSRFTokenHandler)))
}

func (h *Handler) initHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var request struct {
			Path string `json:"path"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if request.Path == "" {
			http.Error(w, "Path is required", http.StatusBadRequest)
			return
		}

		// Validate the path is safe
		absPath, err := filepath.Abs(request.Path)
		if err != nil {
			http.Error(w, "Invalid path", http.StatusBadRequest)
			return
		}

		// Check if the directory exists
		if _, err := os.Stat(absPath); os.IsNotExist(err) {
			http.Error(w, "Directory does not exist", http.StatusBadRequest)
			return
		}

		// Initialize Git repository
		if err := h.git.Init(absPath); err != nil {
			http.Error(w, "Failed to initialize Git repository", http.StatusInternalServerError)
			return
		}

		// Update the config
		h.config.WikiPath = absPath

		// Return success
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"path": absPath,
		})
	}
}

func (h *Handler) configHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			// Return current config
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"wikiPath": h.config.WikiPath,
			})
			return
		}

		if r.Method == http.MethodPost {
			var request struct {
				WikiPath string `json:"wikiPath"`
			}

			if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}

			if request.WikiPath == "" {
				http.Error(w, "Wiki path is required", http.StatusBadRequest)
				return
			}

			// Validate the path is safe
			absPath, err := filepath.Abs(request.WikiPath)
			if err != nil {
				http.Error(w, "Invalid path", http.StatusBadRequest)
				return
			}

			// Check if the directory exists
			if _, err := os.Stat(absPath); os.IsNotExist(err) {
				http.Error(w, "Directory does not exist", http.StatusBadRequest)
				return
			}

			// Update the config
			h.config.WikiPath = absPath

			// Return success
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"wikiPath": absPath,
			})
			return
		}

		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) pullHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if h.config.WikiPath == "" {
			http.Error(w, "Wiki path not set", http.StatusBadRequest)
			return
		}

		if h.git == nil {
			http.Error(w, "Git client not initialized", http.StatusInternalServerError)
			return
		}

		if err := h.git.Pull(h.config.WikiPath); err != nil {
			http.Error(w, "Failed to pull changes: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func (h *Handler) pushHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if h.config.WikiPath == "" {
			http.Error(w, "Wiki path not set", http.StatusBadRequest)
			return
		}

		if h.git == nil {
			http.Error(w, "Git client not initialized", http.StatusInternalServerError)
			return
		}

		if err := h.git.Push(h.config.WikiPath); err != nil {
			errMsg := "Failed to push changes: " + err.Error()
			http.Error(w, errMsg, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func (h *Handler) fetchHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if h.config.WikiPath == "" {
			http.Error(w, "Wiki path not set", http.StatusBadRequest)
			return
		}

		if h.git == nil {
			http.Error(w, "Git client not initialized", http.StatusInternalServerError)
			return
		}

		if err := h.git.Fetch(h.config.WikiPath); err != nil {
			http.Error(w, "Failed to fetch changes: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func (h *Handler) loadHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if h.config.WikiPath == "" {
			http.Error(w, "Wiki path not set", http.StatusBadRequest)
			return
		}

		filename := r.URL.Query().Get("filename")
		if filename == "" {
			http.Error(w, "Filename is required", http.StatusBadRequest)
			return
		}

		// Sanitize the filename to prevent directory traversal
		filename = filepath.Clean(filename)
		if filepath.IsAbs(filename) {
			filename = filename[1:] // Remove leading slash
		}

		// Construct the full path
		fullPath := filepath.Join(h.config.WikiPath, filename)

		// Check if the file exists
		if _, err := os.Stat(fullPath); os.IsNotExist(err) {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}

		// Read the file
		content, err := os.ReadFile(fullPath)
		if err != nil {
			http.Error(w, "Failed to read file", http.StatusInternalServerError)
			return
		}

		// Return the content
		w.Header().Set("Content-Type", "text/plain")
		w.Write(content)
	}
}

func (h *Handler) saveHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if h.config.WikiPath == "" {
			http.Error(w, "Wiki path not set", http.StatusBadRequest)
			return
		}

		var request struct {
			Filename string `json:"filename"`
			Content  string `json:"content"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if request.Filename == "" {
			http.Error(w, "Filename is required", http.StatusBadRequest)
			return
		}

		// Sanitize the filename to prevent directory traversal
		filename := filepath.Clean(request.Filename)
		if filepath.IsAbs(filename) {
			filename = filename[1:] // Remove leading slash
		}

		// Construct the full path
		fullPath := filepath.Join(h.config.WikiPath, filename)

		// Create parent directories if they don't exist
		dir := filepath.Dir(fullPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			http.Error(w, "Failed to create directories", http.StatusInternalServerError)
			return
		}

		// Write the file
		if err := os.WriteFile(fullPath, []byte(request.Content), 0644); err != nil {
			http.Error(w, "Failed to write file", http.StatusInternalServerError)
			return
		}

		// Commit the changes
		if h.git != nil && h.git.IsRepository(h.config.WikiPath) {
			if err := h.git.Commit(h.config.WikiPath, "Update "+filename); err != nil {
				// Log the error but don't fail the request
				// This allows the file to be saved even if Git operations fail
				// For example, if the user hasn't configured Git
				// TODO: Add proper logging
				// fmt.Println("Failed to commit changes:", err)
			}
		}

		// Return success
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"filename": filename,
		})
	}
}

func (h *Handler) deleteHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if h.config.WikiPath == "" {
			http.Error(w, "Wiki path not set", http.StatusBadRequest)
			return
		}

		var request struct {
			Filename string `json:"filename"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if request.Filename == "" {
			http.Error(w, "Filename is required", http.StatusBadRequest)
			return
		}

		// Sanitize the filename to prevent directory traversal
		filename := filepath.Clean(request.Filename)
		if filepath.IsAbs(filename) {
			filename = filename[1:] // Remove leading slash
		}

		// Construct the full path
		fullPath := filepath.Join(h.config.WikiPath, filename)

		// Check if the file exists
		if _, err := os.Stat(fullPath); os.IsNotExist(err) {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}

		// Delete the file
		if err := os.Remove(fullPath); err != nil {
			http.Error(w, "Failed to delete file", http.StatusInternalServerError)
			return
		}

		// Commit the changes
		if h.git != nil && h.git.IsRepository(h.config.WikiPath) {
			if err := h.git.Commit(h.config.WikiPath, "Delete "+filename); err != nil {
				// Log the error but don't fail the request
				// This allows the file to be deleted even if Git operations fail
				// TODO: Add proper logging
				// fmt.Println("Failed to commit changes:", err)
			}
		}

		// Return success
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"filename": filename,
		})
	}
}

func (h *Handler) renderHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var request struct {
			Markdown string `json:"markdown"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if request.Markdown == "" {
			http.Error(w, "Markdown content is required", http.StatusBadRequest)
			return
		}

		// Note: This endpoint is kept for backward compatibility
		// but rendering is now done client-side
		rendered := markdown.Render([]byte(request.Markdown))

		w.Header().Set("Content-Type", "text/html")
		w.Write(rendered)
	}
}
