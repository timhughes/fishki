package handlers

import (
	"encoding/json"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
)

func (h *Handler) statusHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if h.config.WikiPath == "" {
			http.Error(w, "Wiki path not set", http.StatusBadRequest)
			return
		}

		if h.git == nil {
			http.Error(w, "Git client not initialized", http.StatusInternalServerError)
			return
		}

		// Get the current branch name
		cmd := exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD")
		cmd.Dir = h.config.WikiPath
		branchBytes, err := cmd.Output()
		if err != nil {
			http.Error(w, "Failed to get branch name", http.StatusInternalServerError)
			return
		}
		branch := strings.TrimSpace(string(branchBytes))

		// Get ahead/behind counts
		var ahead, behind int
		if h.git.HasRemote(h.config.WikiPath) {
			// Fetch from remote to get accurate counts
			fetchCmd := exec.Command("git", "fetch")
			fetchCmd.Dir = h.config.WikiPath
			_ = fetchCmd.Run() // Ignore errors, we'll continue anyway

			// Get ahead count
			aheadCmd := exec.Command("git", "rev-list", "--count", "@{u}..")
			aheadCmd.Dir = h.config.WikiPath
			aheadBytes, err := aheadCmd.Output()
			if err == nil {
				ahead, _ = strconv.Atoi(strings.TrimSpace(string(aheadBytes)))
			}

			// Get behind count
			behindCmd := exec.Command("git", "rev-list", "--count", "..@{u}")
			behindCmd.Dir = h.config.WikiPath
			behindBytes, err := behindCmd.Output()
			if err == nil {
				behind, _ = strconv.Atoi(strings.TrimSpace(string(behindBytes)))
			}
		}

		// Get modified and untracked counts
		status, err := h.git.Status(h.config.WikiPath)
		if err != nil {
			http.Error(w, "Failed to get status", http.StatusInternalServerError)
			return
		}

		var modified, untracked int
		lines := strings.Split(status, "\n")
		for _, line := range lines {
			if len(line) >= 2 {
				if line[0] == 'M' || line[1] == 'M' {
					modified++
				} else if line[0] == '?' && line[1] == '?' {
					untracked++
				}
			}
		}

		// Return the status as JSON
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"branch":    branch,
			"ahead":     ahead,
			"behind":    behind,
			"modified":  modified,
			"untracked": untracked,
		})
	}
}
