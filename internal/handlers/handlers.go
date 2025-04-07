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

		if h.git == nil {
			http.Error(w, "Git client not initialized", http.StatusInternalServerError)
			return
		}

		if err := h.git.Init(absPath); err != nil {
			http.Error(w, "Failed to initialize repository: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Update the config with the new wiki path
		h.config.WikiPath = absPath
		if err := config.SaveConfig(h.config); err != nil {
			http.Error(w, "Failed to save config: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

func (h *Handler) configHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			// Return current config
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"wikiPath": h.config.WikiPath,
			})
			
		case http.MethodPost:
			// Update config
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
			
			// Validate that the path exists
			if _, err := os.Stat(absPath); os.IsNotExist(err) {
				// Try to create the directory
				if err := os.MkdirAll(absPath, 0755); err != nil {
					http.Error(w, "Failed to create directory: "+err.Error(), http.StatusInternalServerError)
					return
				}
			}
			
			// Update config
			h.config.WikiPath = absPath
			if err := config.SaveConfig(h.config); err != nil {
				http.Error(w, "Failed to save config: "+err.Error(), http.StatusInternalServerError)
				return
			}
			
			w.WriteHeader(http.StatusOK)
			
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
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

		w.WriteHeader(http.StatusOK)
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
			http.Error(w, "Failed to push changes: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

func (h *Handler) loadHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		filename := r.URL.Query().Get("filename")
		if filename == "" {
			http.Error(w, "Filename is required", http.StatusBadRequest)
			return
		}
		
		// Reject requests for directories (paths ending with /)
		if filename[len(filename)-1] == '/' {
			http.Error(w, "Cannot load directory directly", http.StatusBadRequest)
			return
		}

		// Validate and sanitize the path
		filePath, err := ValidatePath(h.config.WikiPath, filename)
		if err != nil {
			http.Error(w, "Invalid file path", http.StatusBadRequest)
			return
		}

		// Check if the file exists
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}

		content, err := os.ReadFile(filePath)
		if err != nil {
			http.Error(w, "Failed to read file", http.StatusInternalServerError)
			return
		}

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

		// Validate and sanitize the path
		filePath, err := ValidatePath(h.config.WikiPath, request.Filename)
		if err != nil {
			http.Error(w, "Invalid file path", http.StatusBadRequest)
			return
		}

		// Create directory if it doesn't exist
		dir := filepath.Dir(filePath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			http.Error(w, "Failed to create directory", http.StatusInternalServerError)
			return
		}

		// Write file with secure permissions
		if err := os.WriteFile(filePath, []byte(request.Content), 0644); err != nil {
			http.Error(w, "Failed to write file", http.StatusInternalServerError)
			return
		}

		// Git operations if client is available
		if h.git != nil {
			// Commit changes to the repository
			if err := h.git.Commit(h.config.WikiPath, "Updated "+request.Filename); err != nil {
				http.Error(w, "Failed to commit changes: "+err.Error(), http.StatusInternalServerError)
				return
			}
			
			// Try to push changes, but don't fail if push fails (might not have remote)
			if h.git.HasRemote(h.config.WikiPath) {
				if err := h.git.Push(h.config.WikiPath); err != nil {
					// Log the error but don't fail the request
					// The changes are still committed locally
					w.Header().Set("X-Git-Push-Error", err.Error())
				}
			}
		}

		w.WriteHeader(http.StatusOK)
	}
}

func (h *Handler) deleteHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
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

		// Validate and sanitize the path
		filePath, err := ValidatePath(h.config.WikiPath, request.Filename)
		if err != nil {
			http.Error(w, "Invalid file path", http.StatusBadRequest)
			return
		}

		// Check if the file exists
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}

		// Delete the file
		if err := os.Remove(filePath); err != nil {
			http.Error(w, "Failed to delete file", http.StatusInternalServerError)
			return
		}

		// Git operations if client is available
		if h.git != nil {
			// Commit the deletion to the repository
			if err := h.git.Commit(h.config.WikiPath, "Deleted "+request.Filename); err != nil {
				http.Error(w, "Failed to commit deletion: "+err.Error(), http.StatusInternalServerError)
				return
			}
			
			// Try to push changes, but don't fail if push fails (might not have remote)
			if h.git.HasRemote(h.config.WikiPath) {
				if err := h.git.Push(h.config.WikiPath); err != nil {
					// Log the error but don't fail the request
					// The changes are still committed locally
					w.Header().Set("X-Git-Push-Error", err.Error())
				}
			}
		}

		// Try to remove empty parent directories
		dir := filepath.Dir(filePath)
		for dir != h.config.WikiPath {
			// Try to remove directory
			if err := os.Remove(dir); err != nil {
				// If error, directory is either not empty or there's another issue
				// Either way, stop trying to remove parents
				break
			}
			dir = filepath.Dir(dir)
		}

		w.WriteHeader(http.StatusOK)
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
