package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"net/http"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// CSRF token configuration
const (
	csrfTokenLength = 32
	csrfCookieName  = "fishki_csrf_token"
	csrfHeaderName  = "X-CSRF-Token"
	csrfMaxAge      = 86400 // 24 hours in seconds
)

var (
	// ErrInvalidPath is returned when a path is outside the allowed directory
	ErrInvalidPath = errors.New("invalid path: outside of allowed directory")
	
	// ErrCSRFValidationFailed is returned when CSRF validation fails
	ErrCSRFValidationFailed = errors.New("CSRF validation failed")
)

// CSRFMiddleware adds CSRF protection to handlers
func CSRFMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip CSRF check for GET, HEAD, OPTIONS requests
		if r.Method == http.MethodGet || r.Method == http.MethodHead || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		// Get token from cookie
		cookie, err := r.Cookie(csrfCookieName)
		if err != nil {
			http.Error(w, "CSRF cookie not found", http.StatusForbidden)
			return
		}

		// Get token from header
		headerToken := r.Header.Get(csrfHeaderName)
		if headerToken == "" {
			http.Error(w, "CSRF token not found in header", http.StatusForbidden)
			return
		}

		// Validate token
		if cookie.Value != headerToken {
			http.Error(w, "CSRF validation failed", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// CSRFTokenHandler generates and sets a CSRF token
func CSRFTokenHandler(w http.ResponseWriter, r *http.Request) {
	token, err := generateCSRFToken()
	if err != nil {
		http.Error(w, "Failed to generate CSRF token", http.StatusInternalServerError)
		return
	}

	// Set cookie
	http.SetCookie(w, &http.Cookie{
		Name:     csrfCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   r.TLS != nil, // Set Secure flag if using HTTPS
		MaxAge:   csrfMaxAge,
		SameSite: http.SameSiteStrictMode,
	})

	// Return token in response
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"csrfToken":"` + token + `"}`))
}

// generateCSRFToken creates a new random token
func generateCSRFToken() (string, error) {
	bytes := make([]byte, csrfTokenLength)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(bytes), nil
}

// SecurityHeadersMiddleware adds security headers to responses
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Content Security Policy
		w.Header().Set("Content-Security-Policy", 
			"default-src 'self'; "+
			"script-src 'self' 'unsafe-inline'; "+
			"style-src 'self' 'unsafe-inline'; "+
			"img-src 'self' data:; "+
			"connect-src 'self'; "+
			"font-src 'self'; "+
			"object-src 'none'; "+
			"frame-ancestors 'none'; "+
			"form-action 'self'; "+
			"base-uri 'self'")
		
		// Other security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		
		next.ServeHTTP(w, r)
	})
}

// ValidatePath ensures a file path is within the allowed directory
func ValidatePath(basePath, requestedPath string) (string, error) {
	// Clean the path to remove any ".." components
	cleanPath := filepath.Clean(requestedPath)
	
	// Ensure the path doesn't start with "/"
	if filepath.IsAbs(cleanPath) {
		return "", ErrInvalidPath
	}
	
	// Ensure the path doesn't contain ".."
	if strings.Contains(cleanPath, "..") {
		return "", ErrInvalidPath
	}
	
	// Join with base path and clean again
	fullPath := filepath.Join(basePath, cleanPath)
	
	// Ensure the resulting path is still within the base path
	relPath, err := filepath.Rel(basePath, fullPath)
	if err != nil || strings.HasPrefix(relPath, "..") || filepath.IsAbs(relPath) {
		return "", ErrInvalidPath
	}
	
	return fullPath, nil
}

// RateLimiter implements a simple rate limiting mechanism
type RateLimiter struct {
	requests     map[string][]time.Time
	windowSize   time.Duration
	maxRequests  int
	mu           sync.Mutex
	cleanupTimer *time.Timer
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(windowSize time.Duration, maxRequests int) *RateLimiter {
	rl := &RateLimiter{
		requests:    make(map[string][]time.Time),
		windowSize:  windowSize,
		maxRequests: maxRequests,
	}
	
	// Start cleanup routine
	rl.cleanupTimer = time.AfterFunc(windowSize, rl.cleanup)
	
	return rl
}

// Allow checks if a request is allowed based on the client's IP
func (rl *RateLimiter) Allow(clientIP string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	
	now := time.Now()
	windowStart := now.Add(-rl.windowSize)
	
	// Filter out old requests
	var recent []time.Time
	for _, t := range rl.requests[clientIP] {
		if t.After(windowStart) {
			recent = append(recent, t)
		}
	}
	
	// Check if we're over the limit
	if len(recent) >= rl.maxRequests {
		return false
	}
	
	// Add current request
	rl.requests[clientIP] = append(recent, now)
	return true
}

// cleanup removes old entries from the requests map
func (rl *RateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	
	now := time.Now()
	windowStart := now.Add(-rl.windowSize)
	
	for ip, times := range rl.requests {
		var recent []time.Time
		for _, t := range times {
			if t.After(windowStart) {
				recent = append(recent, t)
			}
		}
		
		if len(recent) == 0 {
			delete(rl.requests, ip)
		} else {
			rl.requests[ip] = recent
		}
	}
	
	// Schedule next cleanup
	rl.cleanupTimer.Reset(rl.windowSize)
}

// RateLimitMiddleware adds rate limiting to handlers
func RateLimitMiddleware(rl *RateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clientIP := r.RemoteAddr
			
			// Use X-Forwarded-For if behind a proxy
			if forwardedFor := r.Header.Get("X-Forwarded-For"); forwardedFor != "" {
				// Use the first IP in the list
				clientIP = strings.Split(forwardedFor, ",")[0]
			}
			
			if !rl.Allow(clientIP) {
				w.Header().Set("Retry-After", "60")
				http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
				return
			}
			
			next.ServeHTTP(w, r)
		})
	}
}
