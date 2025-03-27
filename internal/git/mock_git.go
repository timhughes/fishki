package git

type MockGitClient struct{}

func NewMock() GitClient {
    return &MockGitClient{}
}

func (m *MockGitClient) Init(path string) error {
    return nil
}

func (m *MockGitClient) Commit(path, message string) error {
    return nil
}

func (m *MockGitClient) Pull(path string) error {
    return nil
}

func (m *MockGitClient) Push(path string) error {
    return nil
}

func (m *MockGitClient) Status(path string) (string, error) {
    return "mock status", nil
}

func (m *MockGitClient) HasRemote(path string) bool {
    return true
}

func (m *MockGitClient) IsRepository(path string) bool {
    return true
}
