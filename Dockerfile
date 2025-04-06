# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Build backend
FROM golang:1.24-alpine AS backend-builder
WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the backend code
COPY . .

# Copy the built frontend files
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Build the backend
RUN CGO_ENABLED=0 GOOS=linux go build -o fishki-server ./cmd/fishki-server

# Final stage
FROM alpine:latest
WORKDIR /app

# Install git
RUN apk add --no-cache git

# Copy the binary and static files
COPY --from=backend-builder /app/fishki-server .
COPY --from=backend-builder /app/frontend/dist ./frontend/dist

# Set up git config
RUN git config --global user.name "Fishki Server" && \
    git config --global user.email "fishki@example.com"

# Expose the port
EXPOSE 8080

# Run the server
CMD ["./fishki-server"]
