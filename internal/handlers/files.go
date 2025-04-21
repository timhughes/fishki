package handlers

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// FileInfo represents a file or folder in the wiki
type FileInfo struct {
	Name     string     `json:"name"`
	Type     string     `json:"type"`
	Path     string     `json:"path"`
	Children []FileInfo `json:"children,omitempty"`
}

// JsonResponse wraps the response data
type JsonResponse struct {
	Files []FileInfo `json:"files"`
}

func (h *Handler) handleFiles(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if h.config.WikiPath == "" {
		http.Error(w, "Wiki path not set", http.StatusBadRequest)
		return
	}

	log.Printf("Getting file tree for wiki path: %s", h.config.WikiPath)
	files, err := buildDirectoryTree(h.config.WikiPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get the repository directory name to use as the root node
	repoName := filepath.Base(h.config.WikiPath)
	
	// Create a root node with the repository name
	rootNode := []FileInfo{
		{
			Name:     repoName,
			Type:     "folder",
			Path:     "",
			Children: files,
		},
	}

	// Create response in the standard format
	response := map[string]interface{}{
		"files": rootNode,
	}

	// Create a buffer for proper formatting
	var buf bytes.Buffer
	encoder := json.NewEncoder(&buf)
	encoder.SetIndent("", "  ")
	encoder.SetEscapeHTML(false)

	// Encode the response
	if err := encoder.Encode(response); err != nil {
		http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Set headers before writing response
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("X-Content-Type-Options", "nosniff")

	// Write the response from buffer
	w.Write(buf.Bytes())
}

// buildDirectoryTree recursively builds a directory tree
func buildDirectoryTree(rootPath string) ([]FileInfo, error) {
	// First, collect all files and directories in a flat structure
	allEntries, err := collectAllEntries(rootPath)
	if err != nil {
		return nil, err
	}
	
	// Then build the tree from the collected entries
	return buildTreeFromEntries(rootPath, allEntries), nil
}

// Entry represents a file or directory with its full information
type Entry struct {
	Name     string
	Path     string
	RelPath  string
	IsDir    bool
	Children []string // Relative paths of children
}

// collectAllEntries walks the entire directory tree and collects all entries
func collectAllEntries(rootPath string) (map[string]Entry, error) {
	entries := make(map[string]Entry)
	
	// First pass: collect all entries
	err := filepath.Walk(rootPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // Skip entries with errors
		}
		
		// Skip .git directory
		if info.IsDir() && info.Name() == ".git" {
			return filepath.SkipDir
		}
		
		// Skip hidden files
		if strings.HasPrefix(info.Name(), ".") {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		
		// Get relative path from root
		relPath, err := filepath.Rel(rootPath, path)
		if err != nil {
			return nil
		}
		
		// Skip root directory
		if relPath == "." {
			return nil
		}
		
		// Only include directories and markdown files
		if info.IsDir() || filepath.Ext(info.Name()) == ".md" {
			// Store entry
			entries[relPath] = Entry{
				Name:    info.Name(),
				Path:    path,
				RelPath: relPath,
				IsDir:   info.IsDir(),
				Children: []string{},
			}
		}
		
		return nil
	})
	
	if err != nil {
		return nil, err
	}
	
	// Second pass: build parent-child relationships
	for relPath := range entries {
		// Skip root entries
		if !strings.Contains(relPath, string(filepath.Separator)) {
			continue
		}
		
		// Get parent path
		parentPath := filepath.Dir(relPath)
		if parentPath == "." {
			parentPath = ""
		}
		
		// Add this entry as a child to its parent
		if parent, exists := entries[parentPath]; exists {
			parent.Children = append(parent.Children, relPath)
			entries[parentPath] = parent
		}
	}
	
	return entries, nil
}

// buildTreeFromEntries converts the flat entry map to a hierarchical tree
func buildTreeFromEntries(rootPath string, entries map[string]Entry) []FileInfo {
	// Get root level entries
	var rootEntries []FileInfo
	
	// Process root level entries (those with no parent or parent is root)
	for relPath, entry := range entries {
		// Check if this is a root level entry
		if !strings.Contains(relPath, string(filepath.Separator)) {
			fileType := "file"
			if entry.IsDir {
				fileType = "folder"
			}
			
			// Create FileInfo for this entry
			fileInfo := FileInfo{
				Name: entry.Name,
				Path: relPath,
				Type: fileType,
			}
			
			// If it's a directory, process its children
			if entry.IsDir {
				fileInfo.Children = processChildren(rootPath, entries, entry)
			}
			
			rootEntries = append(rootEntries, fileInfo)
		}
	}
	
	// Sort entries
	sortEntries(rootEntries)
	
	// Debug: Print the tree structure
	log.Printf("Root files count: %d", len(rootEntries))
	for i := range rootEntries {
		printFileTree(&rootEntries[i], 0)
	}
	
	return rootEntries
}

// processChildren processes children of a directory
func processChildren(rootPath string, allEntries map[string]Entry, parent Entry) []FileInfo {
	var children []FileInfo
	
	// Process each child
	for _, childPath := range parent.Children {
		child, exists := allEntries[childPath]
		if !exists {
			continue
		}
		
		fileType := "file"
		if child.IsDir {
			fileType = "folder"
		}
		
		// Create FileInfo for this child
		fileInfo := FileInfo{
			Name: child.Name,
			Path: child.RelPath,
			Type: fileType,
		}
		
		// If it's a directory, process its children recursively
		if child.IsDir {
			fileInfo.Children = processChildren(rootPath, allEntries, child)
		}
		
		children = append(children, fileInfo)
	}
	
	// Sort children
	sortEntries(children)
	
	return children
}

// sortEntries sorts entries with folders first, then alphabetically
func sortEntries(entries []FileInfo) {
	sort.Slice(entries, func(i, j int) bool {
		// Folders before files
		if entries[i].Type != entries[j].Type {
			return entries[i].Type == "folder"
		}
		// Alphabetical within same type
		return entries[i].Name < entries[j].Name
	})
}

// Helper function to print the file tree for debugging
func printFileTree(file *FileInfo, level int) {
	indent := strings.Repeat("  ", level)
	log.Printf("%s%s (%s) - Children: %d", indent, file.Path, file.Type, len(file.Children))
	for i := range file.Children {
		printFileTree(&file.Children[i], level+1)
	}
}
