package git

import (
	"errors"
	"fmt"
	"testing"
)

func TestErrNotRepository(t *testing.T) {
	err := &ErrNotRepository{Path: "/test/path"}
	expected := "not a git repository: /test/path"
	if err.Error() != expected {
		t.Errorf("Expected error message '%s', got '%s'", expected, err.Error())
	}
}

func TestErrNoRemote(t *testing.T) {
	err := &ErrNoRemote{Path: "/test/path"}
	expected := "no remote repository configured: /test/path"
	if err.Error() != expected {
		t.Errorf("Expected error message '%s', got '%s'", expected, err.Error())
	}
}

func TestErrUncleanWorkingDir(t *testing.T) {
	err := &ErrUncleanWorkingDir{Path: "/test/path"}
	expected := "working directory not clean: /test/path"
	if err.Error() != expected {
		t.Errorf("Expected error message '%s', got '%s'", expected, err.Error())
	}
}

func TestErrGitOperation(t *testing.T) {
	baseErr := errors.New("base error")
	err := &ErrGitOperation{
		Op:  "test",
		Err: baseErr,
		Out: "command output",
	}
	
	expected := "git test failed: base error\nOutput: command output"
	if err.Error() != expected {
		t.Errorf("Expected error message '%s', got '%s'", expected, err.Error())
	}
	
	// Test Unwrap
	unwrapped := err.Unwrap()
	if unwrapped != baseErr {
		t.Errorf("Expected Unwrap to return base error")
	}
	
	// Test with errors.Is
	if !errors.Is(err, baseErr) {
		t.Errorf("Expected errors.Is to return true for base error")
	}
	
	// Test with fmt.Errorf wrapped error
	wrappedErr := fmt.Errorf("wrapped: %w", err)
	if !errors.Is(wrappedErr, baseErr) {
		t.Errorf("Expected errors.Is to work through wrapped error")
	}
}
