package git

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// GitClient defines the interface for Git operations
type GitClient interface {
	Init(repoPath string) error
	Commit(repoPath, message string) error
	Push(repoPath string) error
	Pull(repoPath string) error
	Status(repoPath string) (string, error)
}

// DefaultGitClient is the default implementation of GitClient
type DefaultGitClient struct{}

// Custom error types
var (
	ErrNotARepo = errors.New("not a git repository")
	ErrNoRemote = errors.New("no remote repository configured")
)

// New creates a new DefaultGitClient
func New() GitClient {
	return &DefaultGitClient{}
}

func (c *DefaultGitClient) IsRepository(path string) bool {
	_, err := os.Stat(filepath.Join(path, ".git"))
	return err == nil
}

func (c *DefaultGitClient) HasRemote(path string) bool {
	cmd := exec.Command("git", "remote")
	cmd.Dir = path
	out, err := cmd.CombinedOutput()
	return err == nil && len(strings.TrimSpace(string(out))) > 0
}

func (c *DefaultGitClient) Init(repoPath string) error {
	if c.IsRepository(repoPath) {
		return nil // Already initialized
	}

	cmd := exec.Command("git", "init")
	cmd.Dir = repoPath
	out, err := cmd.CombinedOutput()
	if err != nil {
		return &ErrGitOperation{Op: "init", Err: err, Out: string(out)}
	}
	return nil
}

func (c *DefaultGitClient) Commit(repoPath, message string) error {
	if !c.IsRepository(repoPath) {
		return &ErrNotRepository{Path: repoPath}
	}

	// Add all changes
	cmd := exec.Command("git", "add", ".")
	cmd.Dir = repoPath
	out, err := cmd.CombinedOutput()
	if err != nil {
		return &ErrGitOperation{Op: "add", Err: err, Out: string(out)}
	}

	// Check if there are changes to commit
	clean, err := c.Status(repoPath)
	if err != nil {
		return err
	}
	if clean {
		return nil // Nothing to commit
	}

	// Commit changes
	cmd = exec.Command("git", "commit", "-m", message)
	cmd.Dir = repoPath
	out, err = cmd.CombinedOutput()
	if err != nil {
		return &ErrGitOperation{Op: "commit", Err: err, Out: string(out)}
	}
	return nil
}

func (c *DefaultGitClient) Pull(repoPath string) error {
	if !c.IsRepository(repoPath) {
		return &ErrNotRepository{Path: repoPath}
	}

	if !c.HasRemote(repoPath) {
		return &ErrNoRemote{Path: repoPath}
	}

	// Check for uncommitted changes
	clean, err := c.Status(repoPath)
	if err != nil {
		return err
	}
	if !clean {
		return &ErrUncleanWorkingDir{Path: repoPath}
	}

	cmd := exec.Command("git", "pull")
	cmd.Dir = repoPath
	out, err := cmd.CombinedOutput()
	if err != nil {
		return &ErrGitOperation{Op: "pull", Err: err, Out: string(out)}
	}
	return nil
}

func (c *DefaultGitClient) Push(repoPath string) error {
	if !c.IsRepository(repoPath) {
		return &ErrNotRepository{Path: repoPath}
	}

	if !c.HasRemote(repoPath) {
		return &ErrNoRemote{Path: repoPath}
	}

	// Check for uncommitted changes
	clean, err := c.Status(repoPath)
	if err != nil {
		return err
	}
	if !clean {
		return &ErrUncleanWorkingDir{Path: repoPath}
	}

	cmd := exec.Command("git", "push")
	cmd.Dir = repoPath
	out, err := cmd.CombinedOutput()
	if err != nil {
		return &ErrGitOperation{Op: "push", Err: err, Out: string(out)}
	}
	return nil
}

func (c *DefaultGitClient) Status(repoPath string) (string, error) {
	if !c.IsRepository(repoPath) {
		return "", ErrNotARepo
	}

	cmd := exec.Command("git", "status", "--porcelain")
	cmd.Dir = repoPath
	output, err := cmd.Output()
	if err != nil {
		return "", &ErrGitOperation{Op: "status", Err: err, Out: string(output)}
	}

	return string(output), nil
}
