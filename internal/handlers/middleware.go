package handlers

import (
	"log"
	"net/http"
	"os"
	"time"
)

// responseWriter wraps http.ResponseWriter to capture the status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
	size       int64
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	size, err := rw.ResponseWriter.Write(b)
	rw.size += int64(size)
	return size, err
}

// AccessLoggerMiddleware logs HTTP requests to stdout in a detailed format
func AccessLoggerMiddleware(next http.Handler) http.Handler {
	logger := log.New(os.Stdout, "", log.LstdFlags)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create wrapped response writer to capture status and size
		wrapped := &responseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK, // Default to 200 if not set
		}

		// Process the request
		next.ServeHTTP(wrapped, r)

		// Calculate duration
		duration := time.Since(start)

		// Format query parameters
		queryString := ""
		if len(r.URL.RawQuery) > 0 {
			queryString = "?" + r.URL.RawQuery
		}

		// Log the request details
		logger.Printf("access_log: %s | %s | %s %s%s %s | %d | %d bytes | %v | %q",
			r.RemoteAddr,
			r.UserAgent(),
			r.Method,
			r.URL.Path,
			queryString,
			r.Proto,
			wrapped.statusCode,
			wrapped.size,
			duration,
			r.Header.Get("Referer"),
		)
	})
}

// func Middleware(next http.Handler) http.Handler {
// 	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 		if r.Method != http.MethodGet {
// 			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
// 			return
// 		}
// 		next.ServeHTTP(w, r)
// 	})
// }
