package git

import (
	"testing"
)

func TestGitClient(t *testing.T) {
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
