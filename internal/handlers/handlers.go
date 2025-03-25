package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"

"github.com/timhughes/fishki/internal/config"
"github.com/timhughes/fishki/internal/git"
"github.com/timhughes/fishki/internal/markdown"
)

type Handler struct {
	config *config.Config
}

func NewHandler(cfg *config.Config) *Handler {
	return &Handler{config: cfg}
}

func SetupHandlers(mux *http.ServeMux, cfg *config.Config) {
	h := NewHandler(cfg)

	mux.HandleFunc("/api/init", h.initHandler())
	mux.HandleFunc("/api/commit", h.commitHandler())
	mux.HandleFunc("/api/pull", h.pullHandler())
	mux.HandleFunc("/api/push", h.pushHandler())
	mux.HandleFunc("/api/render", h.renderHandler())
	mux.HandleFunc("/api/save", h.saveHandler())
	mux.HandleFunc("/api/load", h.loadHandler())
	mux.HandleFunc("/api/files", h.handleFiles)
}

func (h *Handler) initHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			Path string `json:"path"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if err := git.InitRepo(req.Path); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		h.config.WikiPath = req.Path
		if err := config.SaveConfig(h.config); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

func (h *Handler) commitHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if h.config.WikiPath == "" {
			http.Error(w, "Wiki path not set", http.StatusBadRequest)
			return
		}

		var req struct {
			Message string `json:"message"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if err := git.Commit(h.config.WikiPath, req.Message); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
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

		if err := git.Pull(h.config.WikiPath); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
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

		if err := git.Push(h.config.WikiPath); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
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

		var req struct {
			Markdown string `json:"markdown"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		rendered := markdown.Render([]byte(req.Markdown))
		w.Header().Set("Content-Type", "text/html")
		w.Write(rendered)
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

		var req struct {
			Filename string `json:"filename"`
			Content  string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

filePath := filepath.Join(h.config.WikiPath, req.Filename)
// Create parent directories if they don't exist
if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
    http.Error(w, "Failed to create directories: "+err.Error(), http.StatusInternalServerError)
    return
}
if err := os.WriteFile(filePath, []byte(req.Content), 0644); err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
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
		if h.config.WikiPath == "" {
			http.Error(w, "Wiki path not set", http.StatusBadRequest)
			return
		}

		filename := r.URL.Query().Get("filename")
		if filename == "" {
			http.Error(w, "Filename not provided", http.StatusBadRequest)
			return
		}

		filePath := filepath.Join(h.config.WikiPath, filename)
		content, err := os.ReadFile(filePath)
		if err != nil {
			if os.IsNotExist(err) {
				http.Error(w, "File not found", http.StatusNotFound)
			} else {
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
			return
		}

		w.Header().Set("Content-Type", "text/plain")
		w.Write(content)
	}
}
