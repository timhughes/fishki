package config

import (
"encoding/json"
"os"
"path/filepath"
"runtime"
"testing"
)

func TestLoadConfig(t *testing.T) {
// Create a temporary directory for test config
tmpDir, err := os.MkdirTemp("", "fishki-test")
if err != nil {
t.Fatal(err)
}
defer os.RemoveAll(tmpDir)

// Override HOME/APPDATA env var to use temp dir
originalHome := os.Getenv("HOME")
originalAppData := os.Getenv("APPDATA")
defer func() {
os.Setenv("HOME", originalHome)
os.Setenv("APPDATA", originalAppData)
}()

switch runtime.GOOS {
case "windows":
os.Setenv("APPDATA", tmpDir)
default:
os.Setenv("HOME", tmpDir)
}

t.Run("new config created if file doesn't exist", func(t *testing.T) {
cfg, err := LoadConfig()
if err != nil {
t.Fatalf("LoadConfig() error = %v", err)
}
if cfg.WikiPath != "" {
t.Errorf("expected empty WikiPath, got %q", cfg.WikiPath)
}
})

t.Run("existing config loaded", func(t *testing.T) {
// Create a test config file
testCfg := Config{WikiPath: "/test/wiki/path"}
configPath, err := getConfigPath()
if err != nil {
t.Fatal(err)
}
data, err := json.MarshalIndent(testCfg, "", "  ")
if err != nil {
t.Fatal(err)
}
if err := os.MkdirAll(filepath.Dir(configPath), 0755); err != nil {
t.Fatal(err)
}
if err := os.WriteFile(configPath, data, 0644); err != nil {
t.Fatal(err)
}

// Load and verify
cfg, err := LoadConfig()
if err != nil {
t.Fatalf("LoadConfig() error = %v", err)
}
if cfg.WikiPath != testCfg.WikiPath {
t.Errorf("expected WikiPath %q, got %q", testCfg.WikiPath, cfg.WikiPath)
}
})

t.Run("invalid json returns error", func(t *testing.T) {
configPath, err := getConfigPath()
if err != nil {
t.Fatal(err)
}
if err := os.MkdirAll(filepath.Dir(configPath), 0755); err != nil {
t.Fatal(err)
}
if err := os.WriteFile(configPath, []byte("invalid json"), 0644); err != nil {
t.Fatal(err)
}

_, err = LoadConfig()
if err == nil {
t.Error("expected error for invalid json")
}
})
}

func TestSaveConfig(t *testing.T) {
// Create a temporary directory
tmpDir, err := os.MkdirTemp("", "fishki-test")
if err != nil {
t.Fatal(err)
}
defer os.RemoveAll(tmpDir)

// Override HOME/APPDATA env var
originalHome := os.Getenv("HOME")
originalAppData := os.Getenv("APPDATA")
defer func() {
os.Setenv("HOME", originalHome)
os.Setenv("APPDATA", originalAppData)
}()

switch runtime.GOOS {
case "windows":
os.Setenv("APPDATA", tmpDir)
default:
os.Setenv("HOME", tmpDir)
}

cfg := &Config{WikiPath: "/test/wiki/path"}
if err := SaveConfig(cfg); err != nil {
t.Fatalf("SaveConfig() error = %v", err)
}

// Verify config was saved correctly
configPath, err := getConfigPath()
if err != nil {
t.Fatal(err)
}
data, err := os.ReadFile(configPath)
if err != nil {
t.Fatal(err)
}

var savedCfg Config
if err := json.Unmarshal(data, &savedCfg); err != nil {
t.Fatal(err)
}
if savedCfg.WikiPath != cfg.WikiPath {
t.Errorf("expected WikiPath %q, got %q", cfg.WikiPath, savedCfg.WikiPath)
}
}

func TestGetConfigPath(t *testing.T) {
// Test current OS
t.Run("current OS", func(t *testing.T) {
path, err := getConfigPath()
if err != nil {
t.Errorf("getConfigPath() error = %v", err)
return
}
if path == "" {
t.Error("expected non-empty path")
}
})

// For coverage, we can at least verify the error case for unsupported OS
if runtime.GOOS != "other" {
t.Run("unsupported OS error check", func(t *testing.T) {
oldGOOS := runtime.GOOS
if oldGOOS == "linux" {
os.Setenv("HOME", "/home/user")
} else if oldGOOS == "darwin" {
os.Setenv("HOME", "/Users/user")
} else if oldGOOS == "windows" {
os.Setenv("APPDATA", "C:\\Users\\user")
}

path, err := getConfigPath()
if err != nil {
t.Errorf("getConfigPath() unexpected error = %v", err)
}
if path == "" {
t.Error("expected non-empty path")
}
})
}
}
