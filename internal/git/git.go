package git

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type GitClient interface {
	Init(path string) error
	Commit(path, message string) error
	Pull(path string) error
	Push(path string) error
	Fetch(path string) error
	Status(path string) (string, error)
	HasRemote(path string) bool
	IsRepository(path string) bool
}

type DefaultGitClient struct{}

func New() GitClient {
	return &DefaultGitClient{}
}

func (g *DefaultGitClient) Init(path string) error {
	cmd := exec.Command("git", "init")
	cmd.Dir = path
	return cmd.Run()
}

func (g *DefaultGitClient) Commit(path, message string) error {
	// Add all files
	addCmd := exec.Command("git", "add", ".")
	addCmd.Dir = path
	if err := addCmd.Run(); err != nil {
		return err
	}

	// Commit with message
	commitCmd := exec.Command("git", "commit", "-m", message)
	commitCmd.Dir = path
	return commitCmd.Run()
}

func (g *DefaultGitClient) Pull(path string) error {
	cmd := exec.Command("git", "pull", "--rebase")
	cmd.Dir = path
	
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	
	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("%s: %s", err.Error(), stderr.String())
	}
	
	return nil
}

func (g *DefaultGitClient) Push(path string) error {
	// First check if there's a remote configured
	if !g.HasRemote(path) {
		return fmt.Errorf("no remote repository configured")
	}
	
	// Then check if the current branch has an upstream branch
	checkUpstreamCmd := exec.Command("git", "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}")
	checkUpstreamCmd.Dir = path
	
	var upstreamStderr bytes.Buffer
	checkUpstreamCmd.Stderr = &upstreamStderr
	
	if err := checkUpstreamCmd.Run(); err != nil {
		// If there's no upstream branch, suggest setting it up
		branchCmd := exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD")
		branchCmd.Dir = path
		branchBytes, branchErr := branchCmd.Output()
		
		if branchErr == nil {
			branch := strings.TrimSpace(string(branchBytes))
			remoteCmd := exec.Command("git", "remote")
			remoteCmd.Dir = path
			remoteBytes, remoteErr := remoteCmd.Output()
			
			if remoteErr == nil && len(remoteBytes) > 0 {
				remote := strings.TrimSpace(string(remoteBytes))
				return fmt.Errorf("no upstream branch configured. Try: git push --set-upstream %s %s", remote, branch)
			}
		}
		
		return fmt.Errorf("no upstream branch configured: %s", upstreamStderr.String())
	}
	
	// Now try to push
	cmd := exec.Command("git", "push")
	cmd.Dir = path
	
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	
	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("%s: %s", err.Error(), stderr.String())
	}
	
	return nil
}

func (g *DefaultGitClient) Fetch(path string) error {
	cmd := exec.Command("git", "fetch")
	cmd.Dir = path
	
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	
	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("%s: %s", err.Error(), stderr.String())
	}
	
	return nil
}

func (g *DefaultGitClient) Status(path string) (string, error) {
	cmd := exec.Command("git", "status", "--porcelain")
	cmd.Dir = path
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return string(output), nil
}

func (g *DefaultGitClient) HasRemote(path string) bool {
	// Check if the repository has a remote configured
	cmd := exec.Command("git", "remote")
	cmd.Dir = path
	output, err := cmd.Output()
	if err != nil {
		return false
	}
	return len(output) > 0
}

func (g *DefaultGitClient) IsRepository(path string) bool {
	// Check if the directory is a git repository
	gitDir := filepath.Join(path, ".git")
	info, err := os.Stat(gitDir)
	if err != nil {
		return false
	}
	return info.IsDir()
}
