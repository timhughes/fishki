package handlers

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"

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

	// Wrap each handler with the access logger middleware
	mux.Handle("/api/files", AccessLoggerMiddleware(http.HandlerFunc(h.handleFiles)))
	mux.Handle("/api/load", AccessLoggerMiddleware(http.HandlerFunc(h.loadHandler())))
	mux.Handle("/api/save", AccessLoggerMiddleware(http.HandlerFunc(h.saveHandler())))
	mux.Handle("/api/delete", AccessLoggerMiddleware(http.HandlerFunc(h.deleteHandler())))
	mux.Handle("/api/render", AccessLoggerMiddleware(http.HandlerFunc(h.renderHandler())))
	mux.Handle("/api/init", AccessLoggerMiddleware(http.HandlerFunc(h.initHandler())))
	mux.Handle("/api/pull", AccessLoggerMiddleware(http.HandlerFunc(h.pullHandler())))
	mux.Handle("/api/push", AccessLoggerMiddleware(http.HandlerFunc(h.pushHandler())))
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

		if h.git == nil {
			http.Error(w, "Git client not initialized", http.StatusInternalServerError)
			return
		}

		if err := h.git.Init(request.Path); err != nil {
			http.Error(w, "Failed to initialize repository: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
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

		filePath := filepath.Join(h.config.WikiPath, filepath.Clean(filename))

		// Check if the file exists
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}

		content, err := ioutil.ReadFile(filePath)
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

		filePath := filepath.Join(h.config.WikiPath, filepath.Clean(request.Filename))

		// Create directory if it doesn't exist
		dir := filepath.Dir(filePath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			http.Error(w, "Failed to create directory", http.StatusInternalServerError)
			return
		}

		if err := ioutil.WriteFile(filePath, []byte(request.Content), 0644); err != nil {
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

		filePath := filepath.Join(h.config.WikiPath, filepath.Clean(request.Filename))

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
