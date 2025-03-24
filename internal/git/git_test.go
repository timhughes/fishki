package git

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func TestInitRepo(t *testing.T) {
	// Create temp directory for test
	tempDir, err := os.MkdirTemp("", "git-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Test successful init
	if err := InitRepo(tempDir); err != nil {
		t.Errorf("InitRepo failed: %v", err)
	}

	// Verify .git directory was created
	if _, err := os.Stat(filepath.Join(tempDir, ".git")); os.IsNotExist(err) {
		t.Error(".git directory was not created")
	}

	// Test init on non-existent directory
	if err := InitRepo("/nonexistent/path"); err == nil {
		t.Error("expected error for non-existent directory")
	}
}

func TestCommit(t *testing.T) {
	// Create temp directory for test
	tempDir, err := os.MkdirTemp("", "git-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Initialize git repo
	if err := InitRepo(tempDir); err != nil {
		t.Fatalf("failed to init repo: %v", err)
	}

	// Create a test file
	testFile := filepath.Join(tempDir, "test.txt")
	if err := os.WriteFile(testFile, []byte("test content"), 0644); err != nil {
		t.Fatalf("failed to create test file: %v", err)
	}

	// Configure git user for commit
	configCmd := exec.Command("git", "config", "user.name", "Test User")
	configCmd.Dir = tempDir
	if err := configCmd.Run(); err != nil {
		t.Fatalf("failed to configure git user name: %v", err)
	}
	configCmd = exec.Command("git", "config", "user.email", "test@example.com")
	configCmd.Dir = tempDir
	if err := configCmd.Run(); err != nil {
		t.Fatalf("failed to configure git user email: %v", err)
	}

	// Test successful commit
	if err := Commit(tempDir, "Test commit"); err != nil {
		t.Errorf("Commit failed: %v", err)
	}

	// Test commit in non-git directory
	nonGitDir, err := os.MkdirTemp("", "non-git-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(nonGitDir)

	if err := Commit(nonGitDir, "Test commit"); err == nil {
		t.Error("expected error for commit in non-git directory")
	}
}

func TestPull(t *testing.T) {
	// Create temp directory for test
	tempDir, err := os.MkdirTemp("", "git-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Initialize git repo
	if err := InitRepo(tempDir); err != nil {
		t.Fatalf("failed to init repo: %v", err)
	}

	// Test pull (should fail as there's no remote)
	if err := Pull(tempDir); err == nil {
		t.Error("expected error for pull with no remote")
	}

	// Test pull in non-git directory
	nonGitDir, err := os.MkdirTemp("", "non-git-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(nonGitDir)

	if err := Pull(nonGitDir); err == nil {
		t.Error("expected error for pull in non-git directory")
	}
}

func TestPush(t *testing.T) {
	// Create temp directory for test
	tempDir, err := os.MkdirTemp("", "git-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Initialize git repo
	if err := InitRepo(tempDir); err != nil {
		t.Fatalf("failed to init repo: %v", err)
	}

	// Test push (should fail as there's no remote)
	if err := Push(tempDir); err == nil {
		t.Error("expected error for push with no remote")
	}

	// Test push in non-git directory
	nonGitDir, err := os.MkdirTemp("", "non-git-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(nonGitDir)

	if err := Push(nonGitDir); err == nil {
		t.Error("expected error for push in non-git directory")
	}
}
