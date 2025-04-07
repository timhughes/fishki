package handlers

import (
	"log"
	"net/http"
	"time"
)

// AccessLoggerMiddleware logs HTTP requests
func AccessLoggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Create a response wrapper to capture the status code
		wrapper := &responseWrapper{ResponseWriter: w, statusCode: http.StatusOK}
		
		// Call the next handler
		next.ServeHTTP(wrapper, r)
		
		// Log the request
		duration := time.Since(start)
		log.Printf("%s %s %s %d %s", r.RemoteAddr, r.Method, r.URL.Path, wrapper.statusCode, duration)
	})
}

// responseWrapper wraps http.ResponseWriter to capture the status code
type responseWrapper struct {
	http.ResponseWriter
	statusCode int
}

// WriteHeader captures the status code
func (rw *responseWrapper) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
