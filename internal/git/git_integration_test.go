//go:build integration

package git

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func TestInitRepoIntegration(t *testing.T) {
	client := New()

	// Create temp directory for test
	tempDir, err := os.MkdirTemp("", "git-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Test successful init
	if err := client.Init(tempDir); err != nil {
		t.Errorf("Init failed: %v", err)
	}

	// Verify .git directory was created
	if !client.IsRepository(tempDir) {
		t.Error(".git directory was not created")
	}

	// Test init on non-existent directory
	if err := client.Init("/nonexistent/path"); err == nil {
		t.Error("expected error for non-existent directory")
	}
}

func TestCommitIntegration(t *testing.T) {
	client := New()

	// Create temp directory for test
	tempDir, err := os.MkdirTemp("", "git-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Initialize git repo
	if err := client.Init(tempDir); err != nil {
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
	if err := client.Commit(tempDir, "Test commit"); err != nil {
		t.Errorf("Commit failed: %v", err)
	}

	// Verify clean status after commit
	clean, err := client.Status(tempDir)
	if err != nil {
		t.Errorf("Status check failed: %v", err)
	}
	if !clean {
		t.Error("expected clean status after commit")
	}

	// Test commit in non-git directory
	nonGitDir, err := os.MkdirTemp("", "non-git-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(nonGitDir)

	err = client.Commit(nonGitDir, "Test commit")
	if _, ok := err.(*ErrNotRepository); !ok {
		t.Errorf("expected ErrNotRepository for commit in non-git directory, got %T", err)
	}
}

func TestPullIntegration(t *testing.T) {
	client := New()

	// Create temp directory for test
	tempDir, err := os.MkdirTemp("", "git-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Initialize git repo
	if err := client.Init(tempDir); err != nil {
		t.Fatalf("failed to init repo: %v", err)
	}

	// Test pull (should fail as there's no remote)
	err = client.Pull(tempDir)
	if _, ok := err.(*ErrNoRemote); !ok {
		t.Errorf("expected ErrNoRemote for pull with no remote, got %T", err)
	}

	// Test pull in non-git directory
	nonGitDir, err := os.MkdirTemp("", "non-git-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(nonGitDir)

	err = client.Pull(nonGitDir)
	if _, ok := err.(*ErrNotRepository); !ok {
		t.Errorf("expected ErrNotRepository for pull in non-git directory, got %T", err)
	}
}

func TestPushIntegration(t *testing.T) {
	client := New()

	// Create temp directory for test
	tempDir, err := os.MkdirTemp("", "git-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Initialize git repo
	if err := client.Init(tempDir); err != nil {
		t.Fatalf("failed to init repo: %v", err)
	}

	// Test push (should fail as there's no remote)
	err = client.Push(tempDir)
	if _, ok := err.(*ErrNoRemote); !ok {
		t.Errorf("expected ErrNoRemote for push with no remote, got %T", err)
	}

	// Test push in non-git directory
	nonGitDir, err := os.MkdirTemp("", "non-git-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(nonGitDir)

	err = client.Push(nonGitDir)
	if _, ok := err.(*ErrNotRepository); !ok {
		t.Errorf("expected ErrNotRepository for push in non-git directory, got %T", err)
	}
}
