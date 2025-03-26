package git

// MockGitClient implements GitClient for testing
type MockGitClient struct {
	CommitCalled   bool
	CommitError    error
	HasRemoteValue bool
	InitError      error
	IsRepoValue    bool
	LastCommitMsg  string
	LastCommitPath string
	PullCalled     bool
	PullError      error
	PushCalled     bool
	PushError      error
	StatusError    error
	StatusValue    string
}

func NewMockGitClient() *MockGitClient {
	return &MockGitClient{
		IsRepoValue:    true,
		HasRemoteValue: true,
		StatusValue:    "",
	}
}

func (m *MockGitClient) IsRepository(path string) bool {
	return m.IsRepoValue
}

func (m *MockGitClient) HasRemote(path string) bool {
	return m.HasRemoteValue
}

func (m *MockGitClient) Status(path string) (string, error) {
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
