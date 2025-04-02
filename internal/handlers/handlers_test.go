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
            body:          map[string]interface{}{"path": handler.config.WikiPath},
            expectedStatus: http.StatusOK,
        },
        {
            name:           "Invalid Method",
            method:         "GET",
            body:          map[string]interface{}{"path": handler.config.WikiPath},
            expectedStatus: http.StatusMethodNotAllowed,
        },
        {
            name:           "Invalid Body",
            method:         "POST",
            body:          map[string]interface{}{},
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
                handler.config.WikiPath = ""
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
                handler.config.WikiPath = ""
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
            body:          map[string]interface{}{"markdown": "# Test"},
            expectedStatus: http.StatusOK,
        },
        {
            name:           "Invalid Method",
            method:         "GET",
            body:          map[string]interface{}{"markdown": "# Test"},
            expectedStatus: http.StatusMethodNotAllowed,
        },
        {
            name:           "Invalid Body",
            method:         "POST",
            body:          map[string]interface{}{},
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

func TestSaveHandler(t *testing.T) {
    handler, cleanup := setupUnitTestHandler(t)
    defer cleanup()

    tests := []struct {
        name           string
        method         string
        body           map[string]interface{}
        setWikiPath    bool
        expectedStatus int
    }{
        {
            name:           "Success",
            method:         "POST",
            body:          map[string]interface{}{"filename": "test.md", "content": "# Test"},
            setWikiPath:    true,
            expectedStatus: http.StatusOK,
        },
        {
            name:           "Invalid Method",
            method:         "GET",
            body:          map[string]interface{}{"filename": "test.md", "content": "# Test"},
            setWikiPath:    true,
            expectedStatus: http.StatusMethodNotAllowed,
        },
        {
            name:           "Wiki Path Not Set",
            method:         "POST",
            body:          map[string]interface{}{"filename": "test.md", "content": "# Test"},
            setWikiPath:    false,
            expectedStatus: http.StatusBadRequest,
        },
        {
            name:           "Invalid Body",
            method:         "POST",
            body:          map[string]interface{}{},
            setWikiPath:    true,
            expectedStatus: http.StatusBadRequest,
        },
    }

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            if !tc.setWikiPath {
                handler.config.WikiPath = ""
            }
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
        setWikiPath    bool
        expectedStatus int
        expectedBody   string
    }{
        {
            name:           "Success",
            method:         "GET",
            filename:       testFilename,
            setWikiPath:    true,
            expectedStatus: http.StatusOK,
            expectedBody:   testContent,
        },
        {
            name:           "Invalid Method",
            method:         "POST",
            filename:       testFilename,
            setWikiPath:    true,
            expectedStatus: http.StatusMethodNotAllowed,
        },
        {
            name:           "Wiki Path Not Set",
            method:         "GET",
            filename:       testFilename,
            setWikiPath:    false,
            expectedStatus: http.StatusBadRequest,
        },
        {
            name:           "File Not Found",
            method:         "GET",
            filename:       "nonexistent.md",
            setWikiPath:    true,
            expectedStatus: http.StatusNotFound,
            expectedBody:   "",
        },
        {
            name:           "Missing Filename",
            method:         "GET",
            filename:       "",
            setWikiPath:    true,
            expectedStatus: http.StatusBadRequest,
        },
    }

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            savedPath := handler.config.WikiPath
            if !tc.setWikiPath {
                handler.config.WikiPath = ""
            }
            req := httptest.NewRequest(tc.method, "/api/load?filename="+tc.filename, nil)
            rr := httptest.NewRecorder()

            handler.loadHandler()(rr, req)

            if rr.Code != tc.expectedStatus {
                t.Errorf("Expected status %v, got %v", tc.expectedStatus, rr.Code)
            }

            if tc.expectedBody != "" && rr.Body.String() != tc.expectedBody {
                t.Errorf("Expected body %q, got %q", tc.expectedBody, rr.Body.String())
            }

            // Restore the original path after the test
            handler.config.WikiPath = savedPath
        })
    }
}

func TestStatusHandler(t *testing.T) {
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
            method:         "GET",
            setWikiPath:    true,
            expectedStatus: http.StatusOK,
        },
        {
            name:           "Invalid Method",
            method:         "POST",
            setWikiPath:    true,
            expectedStatus: http.StatusMethodNotAllowed,
        },
        {
            name:           "Wiki Path Not Set",
            method:         "GET",
            setWikiPath:    false,
            expectedStatus: http.StatusBadRequest,
        },
    }

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            if !tc.setWikiPath {
                handler.config.WikiPath = ""
            }
            req := httptest.NewRequest(tc.method, "/api/status", nil)
            rr := httptest.NewRecorder()

            handler.statusHandler()(rr, req)

            if rr.Code != tc.expectedStatus {
                t.Errorf("Expected status %v, got %v", tc.expectedStatus, rr.Code)
            }
        })
    }
}

func TestHandleFiles(t *testing.T) {
    handler, cleanup := setupUnitTestHandler(t)
    defer cleanup()

    // Create some test files and directories
    testFiles := []struct {
        path    string
        content string
    }{
        {"test1.md", "# Test 1"},
        {"dir1/test2.md", "# Test 2"},
        {"dir1/dir2/test3.md", "# Test 3"},
    }

    for _, tf := range testFiles {
        fullPath := filepath.Join(handler.config.WikiPath, tf.path)
        err := os.MkdirAll(filepath.Dir(fullPath), 0755)
        if err != nil {
            t.Fatalf("Failed to create directories: %v", err)
        }
        err = os.WriteFile(fullPath, []byte(tf.content), 0644)
        if err != nil {
            t.Fatalf("Failed to create test file: %v", err)
        }
    }

    tests := []struct {
        name           string
        method         string
        setWikiPath    bool
        expectedStatus int
    }{
        {
            name:           "Success",
            method:         "GET",
            setWikiPath:    true,
            expectedStatus: http.StatusOK,
        },
        {
            name:           "Invalid Method",
            method:         "POST",
            setWikiPath:    true,
            expectedStatus: http.StatusMethodNotAllowed,
        },
        {
            name:           "Wiki Path Not Set",
            method:         "GET",
            setWikiPath:    false,
            expectedStatus: http.StatusBadRequest,
        },
    }

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            if !tc.setWikiPath {
                handler.config.WikiPath = ""
            }
            req := httptest.NewRequest(tc.method, "/api/files", nil)
            rr := httptest.NewRecorder()

            handler.handleFiles(rr, req)

            if rr.Code != tc.expectedStatus {
                t.Errorf("Expected status %v, got %v", tc.expectedStatus, rr.Code)
            }

            if tc.expectedStatus == http.StatusOK {
                var response JsonResponse
                err := json.NewDecoder(rr.Body).Decode(&response)
                if err != nil {
                    t.Errorf("Failed to decode response: %v", err)
                }

                // Verify basic structure of response
                if len(response.Files) == 0 {
                    t.Error("Expected files in response, got none")
                }
            }
        })
    }
}
