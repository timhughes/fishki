//go:build integration

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
	"github.com/timhughes/fishki/internal/test_utils"
)

func setupGitRepo(t *testing.T, dir string) {
	// Initialize repo
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatalf("Failed to create directory: %v", err)
	}

	// Initialize git repo
	cmd := exec.Command("git", "init")
	cmd.Dir = dir
	if err := cmd.Run(); err != nil {
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

	// Stage and commit the file
	cmd = exec.Command("git", "add", ".")
	cmd.Dir = dir
	if err := cmd.Run(); err != nil {
		t.Fatalf("Failed to stage file: %v", err)
	}

	cmd = exec.Command("git", "commit", "-m", "Initial commit")
	cmd.Dir = dir
	if err := cmd.Run(); err != nil {
		t.Fatalf("Failed to create initial commit: %v", err)
	}
}

func TestInitHandlerIntegration(t *testing.T) {
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

	// Verify .git directory was created
	if _, err := os.Stat(filepath.Join(tempDir, ".git")); os.IsNotExist(err) {
		t.Error(".git directory was not created")
	}
}

func TestCommitHandlerIntegration(t *testing.T) {
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

	reqBody, _ := json.Marshal(map[string]string{"message": "Test commit"})
	req, _ := http.NewRequest("POST", "/api/commit", bytes.NewBuffer(reqBody))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	// Verify commit was created
	cmd := exec.Command("git", "log", "-1", "--pretty=format:%s")
	cmd.Dir = tempDir
	out, err := cmd.Output()
	if err != nil {
		t.Fatalf("Failed to get git log: %v", err)
	}
	if string(out) != "Test commit" {
		t.Errorf("wrong commit message: got %v want %v", string(out), "Test commit")
	}
}

func TestSaveHandlerIntegration(t *testing.T) {
	tempDir, cleanup := test_utils.CreateTempDir(t)
	defer cleanup()

	setupGitRepo(t, tempDir)

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

	// Verify commit was created
	cmd := exec.Command("git", "log", "-1", "--pretty=format:%s")
	cmd.Dir = tempDir
	out, err := cmd.Output()
	if err != nil {
		t.Fatalf("Failed to get git log: %v", err)
	}
	if string(out) != "Update test.md" {
		t.Errorf("wrong commit message: got %v want %v", string(out), "Update test.md")
	}
}

func TestLoadHandlerIntegration(t *testing.T) {
	tempDir, cleanup := test_utils.CreateTempDir(t)
	defer cleanup()

	setupGitRepo(t, tempDir)

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
