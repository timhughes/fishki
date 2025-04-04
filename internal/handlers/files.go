package handlers

import (
"bytes"
"encoding/json"
"fmt"
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
    var files []FileInfo
    var allPaths []string
    pathMap := make(map[string]*FileInfo)

    // First, collect all valid paths
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

        // Store all valid paths
        if info.IsDir() || filepath.Ext(info.Name()) == ".md" {
            fmt.Printf("Found path: %s (isDir: %v)\n", relPath, info.IsDir())
            allPaths = append(allPaths, relPath)
            pathMap[relPath] = &FileInfo{
                Name: info.Name(),
                Path: relPath,
                Type: "file",
            }
            if info.IsDir() {
                pathMap[relPath].Type = "folder"
                pathMap[relPath].Children = make([]FileInfo, 0)
            }
        }

        return nil
    })

    if err != nil {
        return nil, err
    }

    // Sort paths by depth (ensures parents are processed before children)
    sort.Slice(allPaths, func(i, j int) bool {
        depthI := strings.Count(allPaths[i], string(filepath.Separator))
        depthJ := strings.Count(allPaths[j], string(filepath.Separator))
        if depthI != depthJ {
            return depthI < depthJ
        }
        return allPaths[i] < allPaths[j]
    })

    fmt.Printf("\nAll collected paths: %v\n", allPaths)

    // Sort paths by depth to process parents before children
    sort.Slice(allPaths, func(i, j int) bool {
        depthI := strings.Count(allPaths[i], string(filepath.Separator))
        depthJ := strings.Count(allPaths[j], string(filepath.Separator))
        if depthI != depthJ {
            return depthI < depthJ
        }
        return allPaths[i] < allPaths[j]
    })

    fmt.Printf("\nSorted paths: %v\n", allPaths)

    // First pass: Build tree structure using pointers
    var rootFiles []*FileInfo
    for _, path := range allPaths {
        dir := filepath.Dir(path)
        
        if dir == "." {
            fmt.Printf("Adding to root: %s\n", path)
            rootFiles = append(rootFiles, pathMap[path])
        } else {
            fmt.Printf("Looking for parent directory: %s for path: %s\n", dir, path)
            if parent, ok := pathMap[dir]; ok {
                fmt.Printf("Found parent, adding to children: %s -> %s\n", dir, path)
                if parent.Children == nil {
                    parent.Children = make([]FileInfo, 0)
                }
                parent.Children = append(parent.Children, *pathMap[path])
            } else {
                fmt.Printf("Warning: Could not find parent directory: %s for path: %s\n", dir, path)
            }
        }
    }

    // Second pass: Convert pointer slice to value slice for return
    files = make([]FileInfo, len(rootFiles))
    for i, file := range rootFiles {
        files[i] = *file
    }

    // Sort all levels of the tree
    sortFileTree(files)

    fmt.Printf("\nFinal tree structure:\n")
    printTree(files, 0)
    
    return files, nil
}

func printTree(files []FileInfo, level int) {
    indent := strings.Repeat("  ", level)
    for _, file := range files {
        childCount := len(file.Children)
        fmt.Printf("%s- %s (%s, children: %d)\n", indent, file.Path, file.Type, childCount)
        if file.Type == "folder" {
            printTree(file.Children, level+1)
        }
    }
}

func sortFileTree(files []FileInfo) {
    // Sort current level
    sort.Slice(files, func(i, j int) bool {
        // Folders before files
        if files[i].Type != files[j].Type {
            return files[i].Type == "folder"
        }
        // Alphabetical within same type
        return files[i].Name < files[j].Name
    })

    // Sort children recursively
    for i := range files {
        if files[i].Type == "folder" && len(files[i].Children) > 0 {
            sortFileTree(files[i].Children)
        }
    }
}
