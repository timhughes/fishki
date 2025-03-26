package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/timhughes/fishki/internal/config"
	"github.com/timhughes/fishki/internal/git"
	"github.com/timhughes/fishki/internal/test_utils"
)

func setupGitRepo(t *testing.T, dir string) {
	// Initialize repo
	if err := git.InitRepo(dir); err != nil {
		t.Fatalf("Failed to init git repo: %v", err)
	}

	// Configure git user
	gitConfigCmd := exec.Command("git", "config", "--local", "user.name", "Test User")
	gitConfigCmd.Dir = dir
	if err := gitConfigCmd.Run(); err != nil {
		t.Fatalf("Failed to configure git user name: %v", err)
	}

	gitConfigCmd = exec.Command("git", "config", "--local", "user.email", "test@example.com")
	gitConfigCmd.Dir = dir
	if err := gitConfigCmd.Run(); err != nil {
		t.Fatalf("Failed to configure git user email: %v", err)
	}

	// Create and add a file
	dummyFile := filepath.Join(dir, "test.txt")
	if err := os.WriteFile(dummyFile, []byte("test content"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// Stage the file
	addCmd := exec.Command("git", "add", ".")
	addCmd.Dir = dir
	if err := addCmd.Run(); err != nil {
		t.Fatalf("Failed to stage file: %v", err)
	}

	// Initial commit
	commitCmd := exec.Command("git", "commit", "-m", "Initial commit")
	commitCmd.Dir = dir
	if err := commitCmd.Run(); err != nil {
		t.Fatalf("Failed to create initial commit: %v", err)
	}
}

func TestInitHandler(t *testing.T) {
	tempDir, cleanup := test_utils.CreateTempDir(t)
	defer cleanup()

	cfg := &config.Config{}
	mux := http.NewServeMux()
	SetupHandlers(mux, cfg)

	reqBody, _ := json.Marshal(map[string]string{"path": tempDir})
	req, _ := http.NewRequest("POST", "/api/init", bytes.NewBuffer(reqBody))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	if cfg.WikiPath != tempDir {
		t.Errorf("Wiki path not updated in config: got %v want %v", cfg.WikiPath, tempDir)
	}
}

func TestCommitHandler(t *testing.T) {
	tempDir, cleanup := test_utils.CreateTempDir(t)
	defer cleanup()

	setupGitRepo(t, tempDir)

	cfg := &config.Config{WikiPath: tempDir}
	mux := http.NewServeMux()
	SetupHandlers(mux, cfg)

	// Create a new file to commit
	newFile := filepath.Join(tempDir, "new.txt")
	if err := os.WriteFile(newFile, []byte("new content"), 0644); err != nil {
		t.Fatalf("Failed to create new file: %v", err)
	}

	// Add the file to git
	addCmd := exec.Command("git", "add", "new.txt")
	addCmd.Dir = tempDir
	if err := addCmd.Run(); err != nil {
		t.Fatalf("Failed to add file: %v", err)
	}

	reqBody, _ := json.Marshal(map[string]string{"message": "Test commit"})
	req, _ := http.NewRequest("POST", "/api/commit", bytes.NewBuffer(reqBody))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}
}

func TestPullHandler(t *testing.T) {
	tempDir, cleanup := test_utils.CreateTempDir(t)
	defer cleanup()

	setupGitRepo(t, tempDir)

	cfg := &config.Config{WikiPath: tempDir}
	mux := http.NewServeMux()
	SetupHandlers(mux, cfg)

	// Test pull (should fail with no remote)
	req, _ := http.NewRequest("POST", "/api/pull", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusInternalServerError {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusInternalServerError)
	}

	// Test method not allowed
	req, _ = http.NewRequest("GET", "/api/pull", nil)
	rr = httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusMethodNotAllowed {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusMethodNotAllowed)
	}
}

func TestPushHandler(t *testing.T) {
	tempDir, cleanup := test_utils.CreateTempDir(t)
	defer cleanup()

	setupGitRepo(t, tempDir)

	cfg := &config.Config{WikiPath: tempDir}
	mux := http.NewServeMux()
	SetupHandlers(mux, cfg)

	// Test push (should fail with no remote)
	req, _ := http.NewRequest("POST", "/api/push", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusInternalServerError {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusInternalServerError)
	}

	// Test method not allowed
	req, _ = http.NewRequest("GET", "/api/push", nil)
	rr = httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusMethodNotAllowed {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusMethodNotAllowed)
	}
}

func TestRenderHandler(t *testing.T) {
	cfg := &config.Config{}
	mux := http.NewServeMux()
	SetupHandlers(mux, cfg)

	// Test successful render
	markdown := "# Test\nHello, world!"
	reqBody, _ := json.Marshal(map[string]string{"markdown": markdown})
	req, _ := http.NewRequest("POST", "/api/render", bytes.NewBuffer(reqBody))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	if ctype := rr.Header().Get("Content-Type"); ctype != "text/html" {
		t.Errorf("handler returned wrong content type: got %v want %v",
			ctype, "text/html")
	}
}

func TestSaveHandler(t *testing.T) {
	tempDir, cleanup := test_utils.CreateTempDir(t)
	defer cleanup()

	cfg := &config.Config{WikiPath: tempDir}
	mux := http.NewServeMux()
	SetupHandlers(mux, cfg)

	// Test successful save
	reqBody, _ := json.Marshal(map[string]string{
		"filename": "test.md",
		"content":  "# Test\nHello, world!",
	})
	req, _ := http.NewRequest("POST", "/api/save", bytes.NewBuffer(reqBody))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	// Verify file was created
	content, err := os.ReadFile(filepath.Join(tempDir, "test.md"))
	if err != nil {
		t.Errorf("failed to read saved file: %v", err)
	}
	if string(content) != "# Test\nHello, world!" {
		t.Errorf("file content mismatch: got %v want %v",
			string(content), "# Test\nHello, world!")
	}
}

func TestLoadHandler(t *testing.T) {
	tempDir, cleanup := test_utils.CreateTempDir(t)
	defer cleanup()

	// Create a test file
	testContent := "# Test\nHello, world!"
	testFile := filepath.Join(tempDir, "test.md")
	err := os.WriteFile(testFile, []byte(testContent), 0644)
	if err != nil {
		t.Fatalf("failed to create test file: %v", err)
	}

	cfg := &config.Config{WikiPath: tempDir}
	mux := http.NewServeMux()
	SetupHandlers(mux, cfg)

	// Test successful load
	req, _ := http.NewRequest("GET", "/api/load?filename=test.md", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	if ctype := rr.Header().Get("Content-Type"); ctype != "text/plain" {
		t.Errorf("handler returned wrong content type: got %v want %v",
			ctype, "text/plain")
	}

	if body := rr.Body.String(); body != testContent {
		t.Errorf("handler returned wrong body: got %v want %v",
			body, testContent)
	}

	// Test non-existent file
	req, _ = http.NewRequest("GET", "/api/load?filename=nonexistent.md", nil)
	rr = httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusNotFound)
	}
}

type MockGitClient struct {
	StatusFunc func(repoPath string) (string, error)
}

func (m *MockGitClient) Status(repoPath string) (string, error) {
	return m.StatusFunc(repoPath)
}

// Unit test for statusHandler
func TestStatusHandler(t *testing.T) {
	mockGit := &MockGitClient{
		StatusFunc: func(repoPath string) (string, error) {
			return "M modified-file.md", nil
		},
	}

	cfg := &config.Config{WikiPath: "/test/repo"}
	h := &Handler{config: cfg, gitClient: mockGit}
	mux := http.NewServeMux()
	mux.Handle("/api/status", h.statusHandler())

	req, _ := http.NewRequest("GET", "/api/status", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	expected := "M modified-file.md"
	if rr.Body.String() != expected {
		t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), expected)
	}
}
