package git

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func TestGitClientMock(t *testing.T) {
	client := NewMock()

	if err := client.Init("/tmp/repo"); err != nil {
		t.Errorf("Init failed: %v", err)
	}

	if err := client.Commit("/tmp/repo", "Initial commit"); err != nil {
		t.Errorf("Commit failed: %v", err)
	}

	if err := client.Pull("/tmp/repo"); err != nil {
		t.Errorf("Pull failed: %v", err)
	}

	if err := client.Push("/tmp/repo"); err != nil {
		t.Errorf("Push failed: %v", err)
	}

	status, err := client.Status("/tmp/repo")
	if err != nil {
		t.Errorf("Status failed: %v", err)
	}
	if status != "mock status" {
		t.Errorf("Unexpected status: %v", status)
	}

	if !client.HasRemote("/tmp/repo") {
		t.Errorf("Expected HasRemote to return true")
	}

	if !client.IsRepository("/tmp/repo") {
		t.Errorf("Expected IsRepository to return true")
	}
}

// setupGitConfig configures Git user name and email for the test repository
func setupGitConfig(t *testing.T, repoPath string) {
	// Set local Git configuration for the test repository
	cmd := exec.Command("git", "config", "user.name", "Test User")
	cmd.Dir = repoPath
	if err := cmd.Run(); err != nil {
		t.Fatalf("Failed to set git user.name: %v", err)
	}

	cmd = exec.Command("git", "config", "user.email", "test@example.com")
	cmd.Dir = repoPath
	if err := cmd.Run(); err != nil {
		t.Fatalf("Failed to set git user.email: %v", err)
	}
}

func TestDefaultGitClient(t *testing.T) {
	client := New()
	
	// Create a temporary directory for testing
	tempDir, err := os.MkdirTemp("", "git-test")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)
	
	// Test IsRepository (should be false initially)
	if client.IsRepository(tempDir) {
		t.Errorf("Expected IsRepository to return false for new directory")
	}
	
	// Test Init
	err = client.Init(tempDir)
	if err != nil {
		t.Errorf("Init failed: %v", err)
	}
	
	// Set up Git configuration for the test repository
	setupGitConfig(t, tempDir)
	
	// Verify .git directory was created
	if _, err := os.Stat(filepath.Join(tempDir, ".git")); os.IsNotExist(err) {
		t.Errorf("Init did not create .git directory")
	}
	
	// Test IsRepository again (should be true now)
	if !client.IsRepository(tempDir) {
		t.Errorf("Expected IsRepository to return true after init")
	}
	
	// Test HasRemote (should be false for new repo)
	if client.HasRemote(tempDir) {
		t.Errorf("Expected HasRemote to return false for new repo")
	}
	
	// Test Status on empty repo
	status, err := client.Status(tempDir)
	if err != nil {
		t.Errorf("Status failed: %v", err)
	}
	if status != "" {
		t.Errorf("Expected empty status for clean repo, got: %v", status)
	}
	
	// Create a test file
	testFile := filepath.Join(tempDir, "test.txt")
	if err := os.WriteFile(testFile, []byte("test content"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}
	
	// Test Status with uncommitted file
	status, err = client.Status(tempDir)
	if err != nil {
		t.Errorf("Status failed: %v", err)
	}
	if status == "" {
		t.Errorf("Expected non-empty status for repo with changes")
	}
	
	// Test Commit
	err = client.Commit(tempDir, "Test commit")
	if err != nil {
		t.Errorf("Commit failed: %v", err)
	}
	
	// Status should be clean after commit
	status, err = client.Status(tempDir)
	if err != nil {
		t.Errorf("Status failed: %v", err)
	}
	if status != "" {
		t.Errorf("Expected empty status after commit, got: %v", status)
	}
	
	// Test Pull without remote (should fail)
	err = client.Pull(tempDir)
	var noRemoteErr *ErrNoRemote
	if !errors.As(err, &noRemoteErr) {
		t.Errorf("Expected ErrNoRemote, got: %v", err)
	}
	
	// Test Push without remote (should fail)
	err = client.Push(tempDir)
	if !errors.As(err, &noRemoteErr) {
		t.Errorf("Expected ErrNoRemote, got: %v", err)
	}
	
	// Test with non-existent directory
	nonExistentDir := filepath.Join(tempDir, "non-existent")
	
	// Test IsRepository with non-existent directory
	if client.IsRepository(nonExistentDir) {
		t.Errorf("Expected IsRepository to return false for non-existent directory")
	}
	
	// Test Status with non-repository
	_, err = client.Status(nonExistentDir)
	var notRepoErr *ErrNotRepository
	if !errors.As(err, &notRepoErr) {
		t.Errorf("Expected ErrNotRepository, got: %v", err)
	}
	
	// Test Commit with non-repository
	err = client.Commit(nonExistentDir, "Test commit")
	if !errors.As(err, &notRepoErr) {
		t.Errorf("Expected ErrNotRepository, got: %v", err)
	}
}
