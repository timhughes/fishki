package handlers

import (
    "testing"

    "github.com/timhughes/fishki/internal/config"
    "github.com/timhughes/fishki/internal/git"
)

func TestHandlers(t *testing.T) {
    cfg := &config.Config{WikiPath: "/tmp/fishki-wiki"}
    handler := NewHandler(cfg)
    handler.SetGitClient(git.NewMock())
}
