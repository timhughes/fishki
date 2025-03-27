package handlers

import (
"encoding/json"
"fmt"
"log"
"net/http"
"os"
"path/filepath"

"github.com/timhughes/fishki/internal/config"
"github.com/timhughes/fishki/internal/git"
"github.com/timhughes/fishki/internal/markdown"
)

type Handler struct {
config    *config.Config
gitClient git.GitClient
}

func NewHandler(cfg *config.Config) *Handler {
return &Handler{
config:    cfg,
gitClient: git.New(),
}
}

func SetupHandlers(mux *http.ServeMux, cfg *config.Config) {
h := NewHandler(cfg)

// Wrap handlers with AccessLoggerMiddleware
mux.Handle("/api/init", AccessLoggerMiddleware(http.HandlerFunc(h.initHandler())))
mux.Handle("/api/commit", AccessLoggerMiddleware(http.HandlerFunc(h.commitHandler())))
mux.Handle("/api/pull", AccessLoggerMiddleware(http.HandlerFunc(h.pullHandler())))
mux.Handle("/api/push", AccessLoggerMiddleware(http.HandlerFunc(h.pushHandler())))
mux.Handle("/api/render", AccessLoggerMiddleware(http.HandlerFunc(h.renderHandler())))
mux.Handle("/api/save", AccessLoggerMiddleware(http.HandlerFunc(h.saveHandler())))
mux.Handle("/api/load", AccessLoggerMiddleware(http.HandlerFunc(h.loadHandler())))
mux.Handle("/api/files", AccessLoggerMiddleware(http.HandlerFunc(h.handleFiles)))
mux.Handle("/api/status", AccessLoggerMiddleware(http.HandlerFunc(h.statusHandler())))
}

func (h *Handler) SetGitClient(client git.GitClient) {
h.gitClient = client
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

if err := h.gitClient.Init(req.Path); err != nil {
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

if err := h.gitClient.Commit(h.config.WikiPath, req.Message); err != nil {
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

if err := h.gitClient.Pull(h.config.WikiPath); err != nil {
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

if err := h.gitClient.Push(h.config.WikiPath); err != nil {
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

// Auto-commit changes
if err := h.gitClient.Commit(h.config.WikiPath, "Update "+req.Filename); err != nil {
http.Error(w, "Failed to commit changes: "+err.Error(), http.StatusInternalServerError)
return
}

w.WriteHeader(http.StatusOK)
}
}

func (h *Handler) loadHandler() http.HandlerFunc {
return func(w http.ResponseWriter, r *http.Request) {
log.Printf("Load handler called with method: %s and WikiPath: %s", r.Method, h.config.WikiPath)

if r.Method != http.MethodGet {
http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
return
}
if h.config.WikiPath == "" {
http.Error(w, "Wiki path not set", http.StatusBadRequest)
return
}

filename := r.URL.Query().Get("filename")
log.Printf("Loading file: %s", filename)

if filename == "" {
http.Error(w, "Filename not provided", http.StatusBadRequest)
return
}

filePath := filepath.Join(h.config.WikiPath, filename)
log.Printf("Full file path: %s", filePath)

content, err := os.ReadFile(filePath)
if err != nil {
if os.IsNotExist(err) {
log.Printf("File not found: %s", filePath)
// Create an empty file for non-existent files
if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
log.Printf("Failed to create directory: %v", err)
http.Error(w, "Failed to create directory", http.StatusInternalServerError)
return
}
content = []byte(fmt.Sprintf("# %s\n\nThis page is empty.", filename[:len(filename)-3]))
if err := os.WriteFile(filePath, content, 0644); err != nil {
log.Printf("Failed to create file: %v", err)
http.Error(w, "Failed to create file", http.StatusInternalServerError)
return
}
} else {
log.Printf("Error reading file: %v", err)
http.Error(w, err.Error(), http.StatusInternalServerError)
return
}
}

w.Header().Set("Content-Type", "text/plain")
w.Write(content)
}
}

func (h *Handler) statusHandler() http.HandlerFunc {
return func(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodGet {
http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
return
}
if h.config.WikiPath == "" {
http.Error(w, "Wiki path not set", http.StatusBadRequest)
return
}

status, err := h.gitClient.Status(h.config.WikiPath)
if err != nil {
http.Error(w, err.Error(), http.StatusInternalServerError)
return
}

w.Header().Set("Content-Type", "text/plain")
w.Write([]byte(status))
}
}
