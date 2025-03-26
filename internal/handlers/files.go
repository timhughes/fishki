package handlers

import (
	"bytes"
	"encoding/json"
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

	files, err := getFileTree(h.config.WikiPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Create response in the standard format
	response := map[string]interface{}{
		"files": files,
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

func getFileTree(root string) ([]FileInfo, error) {
	files := make([]FileInfo, 0)

	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip git directory
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
		relPath, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}

		// Skip root directory
		if relPath == "." {
			return nil
		}

		fileInfo := FileInfo{
			Name: info.Name(),
			Path: relPath,
			Type: "file",
		}

		if info.IsDir() {
			fileInfo.Type = "folder"
			files = append(files, fileInfo)
		} else if filepath.Ext(info.Name()) == ".md" {
			files = append(files, fileInfo)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Build tree structure
	return buildTree(files), nil
}

func buildTree(files []FileInfo) []FileInfo {
	root := make(map[string]*FileInfo)
	var result []FileInfo

	// First pass: ensure all directories exist
	for _, file := range files {
		dir := filepath.Dir(file.Path)
		if dir != "." {
			parts := strings.Split(dir, string(filepath.Separator))
			currentPath := ""
			for _, part := range parts {
				if currentPath != "" {
					currentPath = filepath.Join(currentPath, part)
				} else {
					currentPath = part
				}

				if _, exists := root[currentPath]; !exists {
					root[currentPath] = &FileInfo{
						Name:     part,
						Type:     "folder",
						Path:     currentPath,
						Children: make([]FileInfo, 0),
					}
				}
			}
		}
	}

	// Second pass: add all files and folders
	for _, file := range files {
		root[file.Path] = &FileInfo{
			Name:     file.Name,
			Type:     file.Type,
			Path:     file.Path,
			Children: make([]FileInfo, 0),
		}
	}

	// Third pass: build tree structure
	for path, info := range root {
		dir := filepath.Dir(path)
		if dir == "." {
			result = append(result, *info)
		} else if parent, ok := root[dir]; ok {
			parent.Children = append(parent.Children, *info)
		}
	}

	// Sort results for consistency
	sort.Slice(result, func(i, j int) bool {
		// Folders before files
		if result[i].Type != result[j].Type {
			return result[i].Type == "folder"
		}
		// Alphabetical within same type
		return result[i].Name < result[j].Name
	})

	// Sort children recursively
	for i := range result {
		if result[i].Type == "folder" {
			sort.Slice(result[i].Children, func(j, k int) bool {
				// Folders before files
				if result[i].Children[j].Type != result[i].Children[k].Type {
					return result[i].Children[j].Type == "folder"
				}
				// Alphabetical within same type
				return result[i].Children[j].Name < result[i].Children[k].Name
			})
		}
	}

	return result
}
