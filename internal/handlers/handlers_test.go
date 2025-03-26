package handlers

import (
"bytes"
"encoding/json"
"net/http"
"net/http/httptest"
"testing"

"github.com/timhughes/fishki/internal/config"
"github.com/timhughes/fishki/internal/git"
)

func TestInitHandlerUnit(t *testing.T) {
mock := git.NewMockGitClient()
cfg := &config.Config{}
handler := NewHandler(cfg)
handler.SetGitClient(mock)

t.Run("Successful Init", func(t *testing.T) {
reqBody, _ := json.Marshal(map[string]string{"path": "/test/path"})
req, _ := http.NewRequest("POST", "/api/init", bytes.NewBuffer(reqBody))
rr := httptest.NewRecorder()

handler.initHandler()(rr, req)

if status := rr.Code; status != http.StatusOK {
t.Errorf("handler returned wrong status code: got %v want %v",
status, http.StatusOK)
}
if cfg.WikiPath != "/test/path" {
t.Errorf("WikiPath not set correctly: got %v want %v",
cfg.WikiPath, "/test/path")
}
})

t.Run("Init Error", func(t *testing.T) {
mock.InitError = &git.ErrGitOperation{Op: "init", Err: &git.ErrNotRepository{Path: "/test/path"}}
reqBody, _ := json.Marshal(map[string]string{"path": "/test/path"})
req, _ := http.NewRequest("POST", "/api/init", bytes.NewBuffer(reqBody))
rr := httptest.NewRecorder()

handler.initHandler()(rr, req)

if status := rr.Code; status != http.StatusInternalServerError {
t.Errorf("handler returned wrong status code: got %v want %v",
status, http.StatusInternalServerError)
}
})

t.Run("Invalid Method", func(t *testing.T) {
req, _ := http.NewRequest("GET", "/api/init", nil)
rr := httptest.NewRecorder()

handler.initHandler()(rr, req)

if status := rr.Code; status != http.StatusMethodNotAllowed {
t.Errorf("handler returned wrong status code: got %v want %v",
status, http.StatusMethodNotAllowed)
}
})
}

func TestCommitHandlerUnit(t *testing.T) {
mock := git.NewMockGitClient()
cfg := &config.Config{WikiPath: "/test/path"}
handler := NewHandler(cfg)
handler.SetGitClient(mock)

t.Run("Successful Commit", func(t *testing.T) {
reqBody, _ := json.Marshal(map[string]string{"message": "test commit"})
req, _ := http.NewRequest("POST", "/api/commit", bytes.NewBuffer(reqBody))
rr := httptest.NewRecorder()

handler.commitHandler()(rr, req)

if status := rr.Code; status != http.StatusOK {
t.Errorf("handler returned wrong status code: got %v want %v",
status, http.StatusOK)
}
if !mock.CommitCalled {
t.Error("commit was not called")
}
if mock.LastCommitPath != "/test/path" {
t.Errorf("wrong commit path: got %v want %v",
mock.LastCommitPath, "/test/path")
}
if mock.LastCommitMsg != "test commit" {
t.Errorf("wrong commit message: got %v want %v",
mock.LastCommitMsg, "test commit")
}
})

t.Run("Commit Error", func(t *testing.T) {
mock.CommitError = &git.ErrGitOperation{Op: "commit", Err: &git.ErrNotRepository{Path: "/test/path"}}
reqBody, _ := json.Marshal(map[string]string{"message": "test commit"})
req, _ := http.NewRequest("POST", "/api/commit", bytes.NewBuffer(reqBody))
rr := httptest.NewRecorder()

handler.commitHandler()(rr, req)

if status := rr.Code; status != http.StatusInternalServerError {
t.Errorf("handler returned wrong status code: got %v want %v",
status, http.StatusInternalServerError)
}
})
}

func TestPullHandlerUnit(t *testing.T) {
mock := git.NewMockGitClient()
cfg := &config.Config{WikiPath: "/test/path"}
handler := NewHandler(cfg)
handler.SetGitClient(mock)

t.Run("Successful Pull", func(t *testing.T) {
req, _ := http.NewRequest("POST", "/api/pull", nil)
rr := httptest.NewRecorder()

handler.pullHandler()(rr, req)

if status := rr.Code; status != http.StatusOK {
t.Errorf("handler returned wrong status code: got %v want %v",
status, http.StatusOK)
}
if !mock.PullCalled {
t.Error("pull was not called")
}
})

t.Run("Pull Error", func(t *testing.T) {
mock.PullError = &git.ErrNoRemote{Path: "/test/path"}
req, _ := http.NewRequest("POST", "/api/pull", nil)
rr := httptest.NewRecorder()

handler.pullHandler()(rr, req)

if status := rr.Code; status != http.StatusInternalServerError {
t.Errorf("handler returned wrong status code: got %v want %v",
status, http.StatusInternalServerError)
}
})
}

func TestPushHandlerUnit(t *testing.T) {
mock := git.NewMockGitClient()
cfg := &config.Config{WikiPath: "/test/path"}
handler := NewHandler(cfg)
handler.SetGitClient(mock)

t.Run("Successful Push", func(t *testing.T) {
req, _ := http.NewRequest("POST", "/api/push", nil)
rr := httptest.NewRecorder()

handler.pushHandler()(rr, req)

if status := rr.Code; status != http.StatusOK {
t.Errorf("handler returned wrong status code: got %v want %v",
status, http.StatusOK)
}
if !mock.PushCalled {
t.Error("push was not called")
}
})

t.Run("Push Error", func(t *testing.T) {
mock.PushError = &git.ErrNoRemote{Path: "/test/path"}
req, _ := http.NewRequest("POST", "/api/push", nil)
rr := httptest.NewRecorder()

handler.pushHandler()(rr, req)

if status := rr.Code; status != http.StatusInternalServerError {
t.Errorf("handler returned wrong status code: got %v want %v",
status, http.StatusInternalServerError)
}
})
}

func TestSaveHandlerUnit(t *testing.T) {
mock := git.NewMockGitClient()
cfg := &config.Config{WikiPath: "/test/path"}
handler := NewHandler(cfg)
handler.SetGitClient(mock)

t.Run("Successful Save and Commit", func(t *testing.T) {
mock.StatusValue = "M test.md" // Simulate modified file
reqBody, _ := json.Marshal(map[string]string{
"filename": "test.md",
"content":  "test content",
})
req, _ := http.NewRequest("POST", "/api/save", bytes.NewBuffer(reqBody))
rr := httptest.NewRecorder()

handler.saveHandler()(rr, req)

if status := rr.Code; status != http.StatusOK {
t.Errorf("handler returned wrong status code: got %v want %v",
status, http.StatusOK)
}
if !mock.CommitCalled {
t.Error("commit was not called after save")
}
if mock.LastCommitMsg != "Update test.md" {
t.Errorf("wrong commit message: got %v want %v",
mock.LastCommitMsg, "Update test.md")
}
})

t.Run("Commit Error After Save", func(t *testing.T) {
mock.CommitError = &git.ErrGitOperation{Op: "commit", Err: &git.ErrNotRepository{Path: "/test/path"}}
mock.StatusValue = "M test.md" // Simulate modified file
reqBody, _ := json.Marshal(map[string]string{
"filename": "test.md",
"content":  "test content",
})
req, _ := http.NewRequest("POST", "/api/save", bytes.NewBuffer(reqBody))
rr := httptest.NewRecorder()

handler.saveHandler()(rr, req)

if status := rr.Code; status != http.StatusInternalServerError {
t.Errorf("handler returned wrong status code: got %v want %v",
status, http.StatusInternalServerError)
}
})
}
