package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

type Config struct {
	WikiPath string `json:"wikiPath"`
}

func LoadConfig() (*Config, error) {
	configPath, err := getConfigPath()
	if err != nil {
		return nil, fmt.Errorf("failed to get config path: %v", err)
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		// If the file doesn't exist, create a default config
		if os.IsNotExist(err) {
			cfg := &Config{WikiPath: ""}
			if err := SaveConfig(cfg); err != nil {
				return nil, fmt.Errorf("failed to save default config: %v", err)
			}
			return cfg, nil
		}
		return nil, fmt.Errorf("failed to read config file: %v", err)
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %v", err)
	}

	return &cfg, nil
}

func SaveConfig(cfg *Config) error {
	configPath, err := getConfigPath()
	if err != nil {
		return fmt.Errorf("failed to get config path: %v", err)
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %v", err)
	}

	if err := os.MkdirAll(filepath.Dir(configPath), 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %v", err)
	}

	if err := os.WriteFile(configPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write config file: %v", err)
	}

	return nil
}

func getConfigPath() (string, error) {
	var configDir string
	switch runtime.GOOS {
	case "linux":
		configDir = filepath.Join(os.Getenv("HOME"), ".config", "fishki")
	case "darwin":
		configDir = filepath.Join(os.Getenv("HOME"), "Library", "Application Support", "fishki")
	case "windows":
		configDir = filepath.Join(os.Getenv("APPDATA"), "fishki")
	default:
		return "", fmt.Errorf("unsupported operating system: %s", runtime.GOOS)
	}
	return filepath.Join(configDir, "config.json"), nil
}
