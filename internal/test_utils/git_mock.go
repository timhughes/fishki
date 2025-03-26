package test_utils

import "errors"

type MockGitClient struct {
	InitFunc   func(repoPath string) error
	CommitFunc func(repoPath, message string) error
	PushFunc   func(repoPath string) error
	PullFunc   func(repoPath string) error
	StatusFunc func(repoPath string) (string, error)
}

func (m *MockGitClient) Init(repoPath string) error {
	if m.InitFunc != nil {
		return m.InitFunc(repoPath)
	}
	return nil
}

func (m *MockGitClient) Commit(repoPath, message string) error {
	if m.CommitFunc != nil {
		return m.CommitFunc(repoPath, message)
	}
	return nil
}

func (m *MockGitClient) Push(repoPath string) error {
	if m.PushFunc != nil {
		return m.PushFunc(repoPath)
	}
	return nil
}

func (m *MockGitClient) Pull(repoPath string) error {
	if m.PullFunc != nil {
		return m.PullFunc(repoPath)
	}
	return nil
}

func (m *MockGitClient) Status(repoPath string) (string, error) {
	if m.StatusFunc != nil {
		return m.StatusFunc(repoPath)
	}
	return "", errors.New("not implemented")
}
