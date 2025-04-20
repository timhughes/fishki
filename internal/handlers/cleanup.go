package handlers

import (
	"os"
	"path/filepath"
)

// cleanupEmptyDirectories recursively removes empty directories up to the root path
func (h *Handler) cleanupEmptyDirectories(dirPath string, rootPath string) {
	// Don't delete the root path itself
	if dirPath == rootPath {
		return
	}
	
	// Check if directory is empty
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return // If we can't read the directory, just return
	}
	
	// If directory is not empty, return
	if len(entries) > 0 {
		return
	}
	
	// Remove the empty directory
	if err := os.Remove(dirPath); err != nil {
		return // If we can't remove the directory, just return
	}
	
	// Recursively check parent directory
	h.cleanupEmptyDirectories(filepath.Dir(dirPath), rootPath)
}
