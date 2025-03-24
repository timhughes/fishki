package git

import (
	"fmt"
	"os/exec"
)

func InitRepo(path string) error {
	cmd := exec.Command("git", "init")
	cmd.Dir = path
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git init failed: %v\n%s", err, out)
	}
	return nil
}

func Commit(path, message string) error {
	cmd := exec.Command("git", "add", ".")
	cmd.Dir = path
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git add failed: %v\n%s", err, out)
	}

	cmd = exec.Command("git", "commit", "-m", message)
	cmd.Dir = path
	out, err = cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git commit failed: %v\n%s", err, out)
	}
	return nil
}

func Pull(path string) error {
	cmd := exec.Command("git", "pull")
	cmd.Dir = path
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git pull failed: %v\n%s", err, out)
	}
	return nil
}

func Push(path string) error {
	cmd := exec.Command("git", "push")
	cmd.Dir = path
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git push failed: %v\n%s", err, out)
	}
	return nil
}
