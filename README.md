# fishki

Wiki using Markdown and Git

## Prerequisites

- Go 1.21 or later
- Node.js 18 or later
- npm

## Building the Application

### Frontend

```bash
# Navigate to the web directory
cd web

# Install dependencies
npm install

# Build the frontend
npm run build
```

### Backend

```bash
# From the project root
go build ./cmd/fishki-server
```

### Building the Complete Application

To build the complete application with the embedded web UI:

```bash
# First build the frontend
cd web && npm install && npm run build && cd ..

# Then build the server with embedded frontend
go build ./cmd/fishki-server
```

## Development

### Running the Frontend in Development Mode

```bash
cd web
npm start
```

This will start the development server on <http://localhost:3000>

### Running the Backend in Development Mode

```bash
go run ./cmd/fishki-server
```

The server will start on port 8080 by default. You can override this by setting the PORT environment variable:

```bash
PORT=3001 go run ./cmd/fishki-server
```

## Testing

### Running Backend Tests

To run all Go tests:

```bash
go test ./...
```

To run tests for a specific package:

```bash
go test ./internal/git
go test ./internal/markdown
go test ./internal/handlers
```

To run tests with coverage:

```bash
go test -cover ./...
```

### Running Frontend Tests

```bash
cd web
npm test
```

## Configuration

The application supports configuration through environment variables:

- `PORT`: The port number for the server (default: 8080)
- Additional configuration options can be found in `internal/config/config.go`
