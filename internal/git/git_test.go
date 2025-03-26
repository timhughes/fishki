package git

import (
	"errors"
	"testing"
)

func TestDefaultGitClientUnit(t *testing.T) {
	client := New()

	t.Run("IsRepository", func(t *testing.T) {
		result := client.IsRepository("/nonexistent/path")
		if result {
			t.Error("expected false for nonexistent path")
		}
	})
}

func TestMockGitClient(t *testing.T) {
	mock := NewMockGitClient()

	t.Run("Default Values", func(t *testing.T) {
		if !mock.IsRepository("") {
			t.Error("expected IsRepository to be true by default")
		}
		if !mock.HasRemote("") {
			t.Error("expected HasRemote to be true by default")
		}
		clean, err := mock.Status("")
		if !clean || err != nil {
			t.Error("expected Status to be clean with no error by default")
		}
	})

	t.Run("Commit Tracking", func(t *testing.T) {
		path := "/test/path"
		message := "test commit"
		mock.CommitError = errors.New("commit error")

		err := mock.Commit(path, message)
		if err != mock.CommitError {
			t.Errorf("expected error %v, got %v", mock.CommitError, err)
		}
		if !mock.CommitCalled {
			t.Error("expected CommitCalled to be true")
		}
		if mock.LastCommitPath != path {
			t.Errorf("expected LastCommitPath %s, got %s", path, mock.LastCommitPath)
		}
		if mock.LastCommitMsg != message {
			t.Errorf("expected LastCommitMsg %s, got %s", message, mock.LastCommitMsg)
		}
	})

	t.Run("Pull Tracking", func(t *testing.T) {
		mock.PullError = errors.New("pull error")
		err := mock.Pull("")
		if err != mock.PullError {
			t.Errorf("expected error %v, got %v", mock.PullError, err)
		}
		if !mock.PullCalled {
			t.Error("expected PullCalled to be true")
		}
	})

	t.Run("Push Tracking", func(t *testing.T) {
		mock.PushError = errors.New("push error")
		err := mock.Push("")
		if err != mock.PushError {
			t.Errorf("expected error %v, got %v", mock.PushError, err)
		}
		if !mock.PushCalled {
			t.Error("expected PushCalled to be true")
		}
	})
}
