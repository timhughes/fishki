package web

import (
	"embed"
	"os"
)

//go:embed dist
var WebBuild embed.FS

// IsTestEnvironment checks if we're running in a test environment
func IsTestEnvironment() bool {
	return os.Getenv("GO_TESTING") == "1"
}
