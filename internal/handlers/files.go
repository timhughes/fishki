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
	files, err := getFileTree(h.config.WikiPath)
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

func getFileTree(root string) ([]FileInfo, error) {
	// Map to store all file info objects by path
	pathMap := make(map[string]*FileInfo)
	
	// First, collect all files and directories
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

		// Store valid paths (directories and markdown files)
		if info.IsDir() || filepath.Ext(info.Name()) == ".md" {
			fileType := "file"
			if info.IsDir() {
				fileType = "folder"
			}
			
			// Create FileInfo object
			pathMap[relPath] = &FileInfo{
				Name:     info.Name(),
				Path:     relPath,
				Type:     fileType,
				Children: []FileInfo{},
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Debug: Print all paths found
	var paths []string
	for path := range pathMap {
		paths = append(paths, path)
	}
	sort.Strings(paths)
	log.Printf("Found %d paths", len(paths))
	for _, p := range paths {
		log.Printf("Path: %s", p)
	}

	// Build the tree structure - completely different approach
	// First, create a map of directories to their children
	dirChildren := make(map[string][]*FileInfo)
	
	// Initialize the map for all directories
	for path, info := range pathMap {
		if info.Type == "folder" {
			dirChildren[path] = []*FileInfo{}
		}
	}
	
	// Add root level as a special case
	dirChildren["."] = []*FileInfo{}
	
	// Populate the children for each directory
	for path, info := range pathMap {
		dir := filepath.Dir(path)
		if dir == "." {
			// Root level item
			dirChildren["."] = append(dirChildren["."], info)
		} else {
			// Nested item
			dirChildren[dir] = append(dirChildren[dir], info)
		}
	}
	
	// Debug the directory structure
	log.Printf("Directory structure:")
	for dir, children := range dirChildren {
		childNames := make([]string, len(children))
		for i, child := range children {
			childNames[i] = child.Name
		}
		log.Printf("  %s: %v", dir, childNames)
	}
	
	// Now build the actual tree by setting children for each directory
	for dir, children := range dirChildren {
		if dir == "." {
			continue // Skip root, we'll handle it separately
		}
		
		if dirInfo, exists := pathMap[dir]; exists {
			// Sort children by type and name
			sort.Slice(children, func(i, j int) bool {
				if children[i].Type != children[j].Type {
					return children[i].Type == "folder" // Folders first
				}
				return children[i].Name < children[j].Name // Then alphabetically
			})
			
			// Set the children for this directory
			dirInfo.Children = make([]FileInfo, len(children))
			for i, child := range children {
				dirInfo.Children[i] = *child
			}
		}
	}
	
	// Finally, build the root level items
	rootItems := dirChildren["."]
	sort.Slice(rootItems, func(i, j int) bool {
		if rootItems[i].Type != rootItems[j].Type {
			return rootItems[i].Type == "folder" // Folders first
		}
		return rootItems[i].Name < rootItems[j].Name // Then alphabetically
	})
	
	rootFiles := make([]FileInfo, len(rootItems))
	for i, item := range rootItems {
		rootFiles[i] = *item
	}
	
	// Debug: Print the tree structure
	log.Printf("Root files count: %d", len(rootFiles))
	for i := range rootFiles {
		printFileTree(&rootFiles[i], 0)
	}
	
	return rootFiles, nil
}

// Helper function to print the file tree for debugging
func printFileTree(file *FileInfo, level int) {
	indent := strings.Repeat("  ", level)
	log.Printf("%s%s (%s) - Children: %d", indent, file.Path, file.Type, len(file.Children))
	for i := range file.Children {
		printFileTree(&file.Children[i], level+1)
	}
}

// Helper function to create parent directories as needed and add a file to its proper place
func createParentDirectories(path string, pathMap map[string]*FileInfo, rootFiles *[]*FileInfo, addedToParent *map[string]bool) {
	// This function is no longer used in the new implementation
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
