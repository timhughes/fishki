package handlers

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "testing"

    "github.com/timhughes/fishki/internal/config"
    "github.com/timhughes/fishki/internal/git"
)

func setupTestConfig() *config.Config {
    return &config.Config{WikiPath: "/tmp/fishki-test"}
}

func setupTestHandler() *Handler {
    cfg := setupTestConfig()
    handler := NewHandler(cfg)
    handler.SetGitClient(git.NewMock())
    return handler
}

func TestSaveHandlerIntegration(t *testing.T) {
    handler := setupTestHandler()

    reqBody := map[string]string{
        "filename": "test.md",
        "content":  "This is a test file.",
    }
    body, _ := json.Marshal(reqBody)
    req := httptest.NewRequest(http.MethodPost, "/api/save", bytes.NewBuffer(body))
    w := httptest.NewRecorder()

    handler.saveHandler()(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("handler returned wrong status code: got %v want %v", w.Code, http.StatusOK)
    }

    filePath := filepath.Join(handler.config.WikiPath, "test.md")
    if _, err := os.Stat(filePath); os.IsNotExist(err) {
        t.Errorf("file was not created: %v", filePath)
    }
}

func TestLoadHandlerIntegration(t *testing.T) {
    handler := setupTestHandler()

    // Ensure the test environment is clean
    os.Remove(filepath.Join(handler.config.WikiPath, "nonexistent.md"))

    // Test loading an existing file
    req := httptest.NewRequest(http.MethodGet, "/api/load?filename=test.md", nil)
    w := httptest.NewRecorder()

    handler.loadHandler()(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("handler returned wrong status code: got %v want %v", w.Code, http.StatusOK)
    }

    // Test loading a non-existent file
    req = httptest.NewRequest(http.MethodGet, "/api/load?filename=nonexistent.md", nil)
    w = httptest.NewRecorder()

    handler.loadHandler()(w, req)

    if w.Code != http.StatusNotFound {
        t.Errorf("handler returned wrong status code: got %v want %v", w.Code, http.StatusNotFound)
    }
}
