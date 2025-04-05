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

func setupIntegrationTest(t *testing.T) (*Handler, func()) {
    // Create a temporary directory for the wiki
    tmpDir, err := os.MkdirTemp("", "fishki-integration-*")
    if err != nil {
        t.Fatalf("Failed to create temp dir: %v", err)
    }

    cfg := &config.Config{WikiPath: tmpDir}
    handler := NewHandler(cfg)
    handler.SetGitClient(git.NewMock())

    cleanup := func() {
        os.RemoveAll(tmpDir)
    }

    return handler, cleanup
}

func TestDeleteHandlerIntegration(t *testing.T) {
    handler, cleanup := setupIntegrationTest(t)
    defer cleanup()

    // Create test file and subdirectory structure
    testContent := "This is a test file."
    testPath := filepath.Join("subdir", "nested", "test.md")
    fullPath := filepath.Join(handler.config.WikiPath, testPath)

    // Create directories and file
    if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
        t.Fatalf("Failed to create test directories: %v", err)
    }
    if err := os.WriteFile(fullPath, []byte(testContent), 0644); err != nil {
        t.Fatalf("Failed to create test file: %v", err)
    }

    // Test deletion
    body := map[string]string{"filename": testPath}
    bodyBytes, _ := json.Marshal(body)
    req := httptest.NewRequest(http.MethodDelete, "/api/delete", bytes.NewBuffer(bodyBytes))
    w := httptest.NewRecorder()

    handler.deleteHandler()(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("handler returned wrong status code: got %v want %v", w.Code, http.StatusOK)
    }

    // Verify file deletion
    if _, err := os.Stat(fullPath); !os.IsNotExist(err) {
        t.Error("file was not deleted")
    }

    // Verify directory cleanup
    parentDir := filepath.Join(handler.config.WikiPath, "subdir", "nested")
    if _, err := os.Stat(parentDir); !os.IsNotExist(err) {
        t.Error("empty parent directory was not deleted")
    }
}

func TestGitIntegration(t *testing.T) {
    handler, cleanup := setupIntegrationTest(t)
    defer cleanup()

    // Test Git init
    initBody := map[string]string{"path": handler.config.WikiPath}
    bodyBytes, _ := json.Marshal(initBody)
    req := httptest.NewRequest(http.MethodPost, "/api/init", bytes.NewBuffer(bodyBytes))
    w := httptest.NewRecorder()

    handler.initHandler()(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("init handler returned wrong status code: got %v want %v", w.Code, http.StatusOK)
    }

    // Test file save with git operations
    saveBody := map[string]string{
        "filename": "test.md",
        "content":  "# Test Content",
    }
    bodyBytes, _ = json.Marshal(saveBody)
    req = httptest.NewRequest(http.MethodPost, "/api/save", bytes.NewBuffer(bodyBytes))
    w = httptest.NewRecorder()

    handler.saveHandler()(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("save handler returned wrong status code: got %v want %v", w.Code, http.StatusOK)
    }

    // Test Git push
    req = httptest.NewRequest(http.MethodPost, "/api/push", nil)
    w = httptest.NewRecorder()

    handler.pushHandler()(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("push handler returned wrong status code: got %v want %v", w.Code, http.StatusOK)
    }

    // Test Git pull
    req = httptest.NewRequest(http.MethodPost, "/api/pull", nil)
    w = httptest.NewRecorder()

    handler.pullHandler()(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("pull handler returned wrong status code: got %v want %v", w.Code, http.StatusOK)
    }
}

func TestSaveHandlerIntegration(t *testing.T) {
    handler, cleanup := setupIntegrationTest(t)
    defer cleanup()

    reqBody := map[string]string{
        "filename": "test.md",
        "content":  "# Test Content",
    }
    body, _ := json.Marshal(reqBody)
    req := httptest.NewRequest(http.MethodPost, "/api/save", bytes.NewBuffer(body))
    w := httptest.NewRecorder()

    handler.saveHandler()(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("handler returned wrong status code: got %v want %v", w.Code, http.StatusOK)
    }

    // Verify file creation and content
    filePath := filepath.Join(handler.config.WikiPath, reqBody["filename"])
    content, err := os.ReadFile(filePath)
    if err != nil {
        t.Errorf("failed to read created file: %v", err)
    }
    if string(content) != reqBody["content"] {
        t.Errorf("file content mismatch: got %v want %v", string(content), reqBody["content"])
    }
}

func TestLoadHandlerIntegration(t *testing.T) {
    handler, cleanup := setupIntegrationTest(t)
    defer cleanup()

    testContent := "# Test Content"
    testFile := filepath.Join(handler.config.WikiPath, "test.md")

    // Create test file
    if err := os.WriteFile(testFile, []byte(testContent), 0644); err != nil {
        t.Fatalf("Failed to create test file: %v", err)
    }

    // Test loading existing file
    req := httptest.NewRequest(http.MethodGet, "/api/load?filename=test.md", nil)
    w := httptest.NewRecorder()

    handler.loadHandler()(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("handler returned wrong status code: got %v want %v", w.Code, http.StatusOK)
    }

    if w.Body.String() != testContent {
        t.Errorf("handler returned wrong content: got %v want %v", w.Body.String(), testContent)
    }

    // Test loading non-existent file
    req = httptest.NewRequest(http.MethodGet, "/api/load?filename=nonexistent.md", nil)
    w = httptest.NewRecorder()

    handler.loadHandler()(w, req)

    if w.Code != http.StatusNotFound {
        t.Errorf("handler returned wrong status code: got %v want %v", w.Code, http.StatusNotFound)
    }
}
