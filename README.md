# Fishki

A modern, Git-backed wiki system that uses Markdown for content creation and version control. Fishki combines the simplicity of Markdown with the power of Git for a robust documentation and knowledge management solution.

## Features

- 📝 Markdown-based content editing
- 🌳 Git-backed version control
- 📁 Hierarchical file organization
- 🔍 Real-time preview
- 📱 Responsive design
- 🎨 Syntax highlighting for code blocks
- 🔄 Automatic save and version control
- 📂 File browser with folder support

## Technology Stack

- **Frontend**:
  - React 18
  - TypeScript
  - Material-UI (MUI)
  - React Router
  - React Markdown

- **Backend**:
  - Go 1.21+
  - Git integration
  - Built-in HTTP server

## Project Structure

```
fishki/
├── cmd/                 # Command-line entry points
├── configs/             # Configuration files
├── internal/            # Internal packages
│   ├── config/          # Configuration handling
│   ├── git/             # Git operations
│   ├── handlers/        # HTTP handlers
│   ├── markdown/        # Markdown processing
│   └── test_utils/      # Testing utilities
├── scripts/             # Build and maintenance scripts
├── web/                 # Frontend application
│   ├── public/          # Static assets
│   └── src/             # React source code
│       ├── components/  # React components
│       ├── hooks/       # Custom React hooks
│       └── types/       # TypeScript type definitions
└── README.md            # Project documentation
```

## Prerequisites

- Go 1.21 or later
- Node.js 18 or later
- npm
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/timhughes/fishki.git
   cd fishki
   ```

2. Install frontend dependencies:
   ```bash
   cd web
   npm install
   ```

3. Build the frontend:
   ```bash
   npm run build
   ```

4. Build the backend:
   ```bash
   cd ..
   go build ./cmd/fishki-server
   ```

## Development Setup

### Frontend Development

```bash
cd web
npm start
```

This will start the development server on http://localhost:3000 with:
- Hot reload
- Development error overlay
- Source maps
- ESLint integration

### Backend Development

```bash
go run ./cmd/fishki-server
```

The server will start on port 8080 by default. Configure using environment variables:
```bash
PORT=3001 go run ./cmd/fishki-server
```

## Testing

### Backend Tests

Run all Go tests:
```bash
go test ./...
```

Run specific package tests:
```bash
go test ./internal/git
go test ./internal/markdown
go test ./internal/handlers
```

Generate coverage report:
```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Frontend Tests

Run React component tests:
```bash
cd web
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Configuration

### Environment Variables

- `PORT`: Server port number (default: 8080)
- Additional configuration options in `internal/config/config.go`

### Git Configuration

The application uses the local Git configuration for commit author information. Ensure Git is properly configured:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Architecture

### Frontend Architecture

The React frontend follows a component-based architecture with:
- Centralized API service layer
- Custom React hooks for data fetching and operations
- TypeScript for type safety
- Material-UI for consistent design
- File-based routing with React Router

### Backend Architecture

The Go backend is structured with:
- Clean architecture principles
- Middleware-based HTTP handling
- Git integration for version control
- Markdown parsing and rendering
- Concurrent request handling

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Frontend: Follow ESLint configuration
- Backend: Use `go fmt` and `golint`
- Write meaningful commit messages
- Include tests for new features

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- React team for the amazing frontend library
- Go team for the efficient backend language
- Material-UI team for the component library
- All contributors who have helped shape this project
