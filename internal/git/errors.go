package git

import "fmt"

// ErrNotRepository indicates that the given path is not a git repository
type ErrNotRepository struct {
	Path string
}

func (e *ErrNotRepository) Error() string {
	return fmt.Sprintf("not a git repository: %s", e.Path)
}

// ErrUncleanWorkingDir indicates that there are uncommitted changes
type ErrUncleanWorkingDir struct {
	Path string
}

func (e *ErrUncleanWorkingDir) Error() string {
	return fmt.Sprintf("working directory not clean: %s", e.Path)
}

// ErrNoRemote indicates that the repository has no remote configured
type ErrNoRemote struct {
	Path string
}

func (e *ErrNoRemote) Error() string {
	return fmt.Sprintf("no remote configured: %s", e.Path)
}

// ErrGitOperation wraps git command errors
type ErrGitOperation struct {
	Op  string
	Err error
	Out string
}

func (e *ErrGitOperation) Error() string {
	return fmt.Sprintf("git %s failed: %v\nOutput: %s", e.Op, e.Err, e.Out)
}

func (e *ErrGitOperation) Unwrap() error {
	return e.Err
}
