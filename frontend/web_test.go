package web

import (
	"os"
	"testing"
)

func init() {
	// Set test environment flag
	os.Setenv("GO_TESTING", "1")
}

func TestDummy(t *testing.T) {
	// Just a dummy test to make sure the package is testable
	if !IsTestEnvironment() {
		t.Error("Expected to be in test environment")
	}
}
