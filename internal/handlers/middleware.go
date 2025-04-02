package handlers

import (
	"log"
	"net/http"
	"net/url"
	"os"
	"time"
)

// AccessLoggerMiddleware logs HTTP requests to stdout
func AccessLoggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.New(os.Stdout, "", log.LstdFlags).Printf(
			"%s %s %s%s%s %s",
			r.RemoteAddr,
			r.Method,
			r.URL.Path,
			func() string {
				if len(r.URL.Query()) > 0 {
					return "?"
				}
				return ""
			}(),
			formatQueryParams(r.URL.Query()),
			time.Since(start),
		)
	})
}

// formatQueryParams formats URL query parameters as a string
func formatQueryParams(params url.Values) string {
	if len(params) == 0 {
		return ""
	}
	return params.Encode()
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
