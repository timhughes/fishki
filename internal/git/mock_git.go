package git

// MockGitClient implements GitClient for testing
type MockGitClient struct {
	IsRepoValue    bool
	HasRemoteValue bool
	StatusValue    bool
	StatusError    error
	InitError      error
	CommitError    error
	PullError      error
	PushError      error
	CommitCalled   bool
	PullCalled     bool
	PushCalled     bool
	LastCommitPath string
	LastCommitMsg  string
}

func NewMockGitClient() *MockGitClient {
	return &MockGitClient{
		IsRepoValue:    true,
		HasRemoteValue: true,
		StatusValue:    true,
	}
}

func (m *MockGitClient) IsRepository(path string) bool {
	return m.IsRepoValue
}

func (m *MockGitClient) HasRemote(path string) bool {
	return m.HasRemoteValue
}

func (m *MockGitClient) Status(path string) (bool, error) {
	return m.StatusValue, m.StatusError
}

func (m *MockGitClient) Init(path string) error {
	return m.InitError
}

func (m *MockGitClient) Commit(path, message string) error {
	m.CommitCalled = true
	m.LastCommitPath = path
	m.LastCommitMsg = message
	return m.CommitError
}

func (m *MockGitClient) Pull(path string) error {
	m.PullCalled = true
	return m.PullError
}

func (m *MockGitClient) Push(path string) error {
	m.PushCalled = true
	return m.PushError
}
