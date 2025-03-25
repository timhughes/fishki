package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type FileInfo struct {
	Name     string     `json:"name"`
	Type     string     `json:"type"`
	Path     string     `json:"path"`
	Children []FileInfo `json:"children,omitempty"`
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(files)
}

func getFileTree(root string) ([]FileInfo, error) {
	var files []FileInfo

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

    return result
}
