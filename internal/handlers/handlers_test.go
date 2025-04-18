package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/timhughes/fishki/internal/config"
	"github.com/timhughes/fishki/internal/git"
)

func setupUnitTestHandler(t *testing.T) (*Handler, func()) {
	// Create a temporary directory for the wiki
	tmpDir, err := os.MkdirTemp("", "fishki-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}

	cfg := &config.Config{WikiPath: tmpDir}
	handler := NewHandler(cfg)
	handler.SetGitClient(git.NewMock())

	cleanup := func() {
		os.RemoveAll(tmpDir)
	}

	return handler, cleanup
}

func TestHandleFiles(t *testing.T) {
	handler, cleanup := setupUnitTestHandler(t)
	defer cleanup()

	// Create test files
	testDir := filepath.Join(handler.config.WikiPath, "testdir")
	if err := os.MkdirAll(testDir, 0755); err != nil {
		t.Fatalf("Failed to create test directory: %v", err)
	}
	
	testFile := filepath.Join(handler.config.WikiPath, "test.md")
	if err := os.WriteFile(testFile, []byte("# Test"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// Test the handler
	req := httptest.NewRequest("GET", "/api/files", nil)
	rr := httptest.NewRecorder()

	handler.handleFiles(rr, req)

	// Check status code
	if rr.Code != http.StatusOK {
		t.Errorf("Expected status %v, got %v", http.StatusOK, rr.Code)
	}

	// Parse response
	var response map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Check that files array exists
	files, ok := response["files"].([]interface{})
	if !ok {
		t.Fatalf("Expected files array in response, got %T", response["files"])
	}

	// Check that there's exactly one root node
	if len(files) != 1 {
		t.Fatalf("Expected 1 root node, got %d", len(files))
	}

	// Check root node properties
	rootNode, ok := files[0].(map[string]interface{})
	if !ok {
		t.Fatalf("Expected root node to be an object, got %T", files[0])
	}

	// Check that root node has the repository name
	repoName := filepath.Base(handler.config.WikiPath)
	if rootNode["name"] != repoName {
		t.Errorf("Expected root node name to be %q, got %q", repoName, rootNode["name"])
	}

	// Check that root node has empty path
	if rootNode["path"] != "" {
		t.Errorf("Expected root node path to be empty, got %q", rootNode["path"])
	}

	// Check that root node has children
	children, ok := rootNode["children"].([]interface{})
	if !ok {
		t.Fatalf("Expected root node to have children, got %T", rootNode["children"])
	}

	// Check that children contain the test files
	if len(children) < 1 {
		t.Errorf("Expected at least one child in root node, got %d", len(children))
	}
}

func TestInitHandler(t *testing.T) {
	handler, cleanup := setupUnitTestHandler(t)
	defer cleanup()

	tests := []struct {
		name           string
		method         string
		body           map[string]interface{}
		expectedStatus int
	}{
		{
			name:           "Success",
			method:         "POST",
			body:           map[string]interface{}{"path": handler.config.WikiPath},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid Method",
			method:         "GET",
			body:           map[string]interface{}{"path": handler.config.WikiPath},
			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name:           "Invalid Body",
			method:         "POST",
			body:           map[string]interface{}{},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			bodyBytes, _ := json.Marshal(tc.body)
			req := httptest.NewRequest(tc.method, "/api/init", bytes.NewBuffer(bodyBytes))
			rr := httptest.NewRecorder()

			handler.initHandler()(rr, req)

			if rr.Code != tc.expectedStatus {
				t.Errorf("Expected status %v, got %v", tc.expectedStatus, rr.Code)
			}
		})
	}
}

func TestPullHandler(t *testing.T) {
	handler, cleanup := setupUnitTestHandler(t)
	defer cleanup()

	tests := []struct {
		name           string
		method         string
		setWikiPath    bool
		expectedStatus int
	}{
		{
			name:           "Success",
			method:         "POST",
			setWikiPath:    true,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid Method",
			method:         "GET",
			setWikiPath:    true,
			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name:           "Wiki Path Not Set",
			method:         "POST",
			setWikiPath:    false,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if !tc.setWikiPath {
				savedPath := handler.config.WikiPath
				handler.config.WikiPath = ""
				defer func() { handler.config.WikiPath = savedPath }()
			}

			req := httptest.NewRequest(tc.method, "/api/pull", nil)
			rr := httptest.NewRecorder()

			handler.pullHandler()(rr, req)

			if rr.Code != tc.expectedStatus {
				t.Errorf("Expected status %v, got %v", tc.expectedStatus, rr.Code)
			}
		})
	}
}

func TestPushHandler(t *testing.T) {
	handler, cleanup := setupUnitTestHandler(t)
	defer cleanup()

	tests := []struct {
		name           string
		method         string
		setWikiPath    bool
		expectedStatus int
	}{
		{
			name:           "Success",
			method:         "POST",
			setWikiPath:    true,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid Method",
			method:         "GET",
			setWikiPath:    true,
			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name:           "Wiki Path Not Set",
			method:         "POST",
			setWikiPath:    false,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if !tc.setWikiPath {
				savedPath := handler.config.WikiPath
				handler.config.WikiPath = ""
				defer func() { handler.config.WikiPath = savedPath }()
			}

			req := httptest.NewRequest(tc.method, "/api/push", nil)
			rr := httptest.NewRecorder()

			handler.pushHandler()(rr, req)

			if rr.Code != tc.expectedStatus {
				t.Errorf("Expected status %v, got %v", tc.expectedStatus, rr.Code)
			}
		})
	}
}

func TestSaveHandler(t *testing.T) {
	handler, cleanup := setupUnitTestHandler(t)
	defer cleanup()

	tests := []struct {
		name           string
		method         string
		body           map[string]interface{}
		expectedStatus int
	}{
		{
			name:           "Success",
			method:         "POST",
			body:           map[string]interface{}{"filename": "test.md", "content": "# Test"},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid Method",
			method:         "GET",
			body:           map[string]interface{}{"filename": "test.md", "content": "# Test"},
			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name:           "Invalid Body",
			method:         "POST",
			body:           map[string]interface{}{},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			bodyBytes, _ := json.Marshal(tc.body)
			req := httptest.NewRequest(tc.method, "/api/save", bytes.NewBuffer(bodyBytes))
			rr := httptest.NewRecorder()

			handler.saveHandler()(rr, req)

			if rr.Code != tc.expectedStatus {
				t.Errorf("Expected status %v, got %v", tc.expectedStatus, rr.Code)
			}
		})
	}
}

func TestLoadHandler(t *testing.T) {
	handler, cleanup := setupUnitTestHandler(t)
	defer cleanup()

	// Create a test file
	testContent := "# Test Content"
	testFilename := "test.md"
	err := os.WriteFile(filepath.Join(handler.config.WikiPath, testFilename), []byte(testContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	tests := []struct {
		name           string
		method         string
		filename       string
		expectedStatus int
		expectedBody   string
	}{
		{
			name:           "Success",
			method:         "GET",
			filename:       testFilename,
			expectedStatus: http.StatusOK,
			expectedBody:   testContent,
		},
		{
			name:           "Invalid Method",
			method:         "POST",
			filename:       testFilename,
			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name:           "File Not Found",
			method:         "GET",
			filename:       "nonexistent.md",
			expectedStatus: http.StatusNotFound,
			expectedBody:   "",
		},
		{
			name:           "Missing Filename",
			method:         "GET",
			filename:       "",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, "/api/load?filename="+tc.filename, nil)
			rr := httptest.NewRecorder()

			handler.loadHandler()(rr, req)

			if rr.Code != tc.expectedStatus {
				t.Errorf("Expected status %v, got %v", tc.expectedStatus, rr.Code)
			}

			if tc.expectedBody != "" && rr.Body.String() != tc.expectedBody {
				t.Errorf("Expected body %q, got %q", tc.expectedBody, rr.Body.String())
			}
		})
	}
}

func TestDeleteHandler(t *testing.T) {
	handler, cleanup := setupUnitTestHandler(t)
	defer cleanup()

	// Create test file and subdirectory structure
	testContent := "This is a test file."
	testPath := filepath.Join("subdir", "nested", "test.md")
	fullPath := filepath.Join(handler.config.WikiPath, testPath)

	// Create directories
	err := os.MkdirAll(filepath.Dir(fullPath), 0755)
	if err != nil {
		t.Fatalf("Failed to create test directories: %v", err)
	}

	// Create file
	err = os.WriteFile(fullPath, []byte(testContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	tests := []struct {
		name           string
		method         string
		body           map[string]interface{}
		expectedStatus int
	}{
		{
			name:           "Success",
			method:         "DELETE",
			body:           map[string]interface{}{"filename": testPath},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid Method",
			method:         "POST",
			body:           map[string]interface{}{"filename": testPath},
			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name:           "Invalid Body",
			method:         "DELETE",
			body:           map[string]interface{}{},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "File Not Found",
			method:         "DELETE",
			body:           map[string]interface{}{"filename": "nonexistent.md"},
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if tc.name == "Success" {
				// Recreate the test file for each success test
				os.MkdirAll(filepath.Dir(fullPath), 0755)
				if err := os.WriteFile(fullPath, []byte(testContent), 0644); err != nil {
					t.Fatalf("Failed to create test file: %v", err)
				}
			}

			bodyBytes, _ := json.Marshal(tc.body)
			req := httptest.NewRequest(tc.method, "/api/delete", bytes.NewBuffer(bodyBytes))
			rr := httptest.NewRecorder()

			handler.deleteHandler()(rr, req)

			if rr.Code != tc.expectedStatus {
				t.Errorf("Expected status %v, got %v", tc.expectedStatus, rr.Code)
			}

			if tc.expectedStatus == http.StatusOK {
				// Verify file deletion
				if _, err := os.Stat(fullPath); !os.IsNotExist(err) {
					t.Error("File was not deleted")
				}
				// Verify directory cleanup
				parentDir := filepath.Join(handler.config.WikiPath, "subdir", "nested")
				if _, err := os.Stat(parentDir); !os.IsNotExist(err) {
					t.Error("Empty parent directory was not deleted")
				}
			}
		})
	}
}

func TestRenderHandler(t *testing.T) {
	handler, cleanup := setupUnitTestHandler(t)
	defer cleanup()

	tests := []struct {
		name           string
		method         string
		body           map[string]interface{}
		expectedStatus int
	}{
		{
			name:           "Success",
			method:         "POST",
			body:           map[string]interface{}{"markdown": "# Test"},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid Method",
			method:         "GET",
			body:           map[string]interface{}{"markdown": "# Test"},
			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name:           "Invalid Body",
			method:         "POST",
			body:           map[string]interface{}{},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			bodyBytes, _ := json.Marshal(tc.body)
			req := httptest.NewRequest(tc.method, "/api/render", bytes.NewBuffer(bodyBytes))
			rr := httptest.NewRecorder()

			handler.renderHandler()(rr, req)

			if rr.Code != tc.expectedStatus {
				t.Errorf("Expected status %v, got %v", tc.expectedStatus, rr.Code)
			}
		})
	}
}
