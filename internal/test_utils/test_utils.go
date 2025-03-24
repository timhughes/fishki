package test_utils

import (
	"os"
	"testing"
)

// CreateTempDir creates a temporary directory and returns its path along with a cleanup function
func CreateTempDir(t *testing.T) (string, func()) {
	tempDir, err := os.MkdirTemp("", "fishki-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	return tempDir, func() { os.RemoveAll(tempDir) }
}
