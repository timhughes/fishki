# Variables
GO_CMD=go
GO_BUILD=$(GO_CMD) build
GO_TEST=$(GO_CMD) test
GO_FMT=$(GO_CMD) fmt
GO_VET=$(GO_CMD) vet
FRONTEND_DIR=frontend
FRONTEND_BUILD_CMD=npm run build
FRONTEND_INSTALL_CMD=npm install

# Targets
.PHONY: all build test fmt vet frontend-build frontend-install clean

help:  ## These help instructions
	@sed -rn 's/^([a-zA-Z0-9_-]+):.* ## (.*)$$/"\1" "\2"/p' < $(MAKEFILE_LIST)|xargs printf "$(_GREEN)make %-20s$(_RESET) # %s\n"


all: build test

build: ## Build the application
	$(GO_BUILD) -o bin/fishki-server ./cmd/fishki-server

test: ## Run tests
	$(GO_TEST) ./...

fmt: ## Format the code
	$(GO_FMT) ./...

vet: ## Run go vet
	$(GO_VET) ./...

run: frontend-build ## Run the application
	$(GO_CMD) run ./cmd/fishki-server

frontend-build: ## Build the frontend application
	cd $(FRONTEND_DIR) && $(FRONTEND_BUILD_CMD)

frontend-install: ## Install frontend dependencies
	cd $(FRONTEND_DIR) && $(FRONTEND_INSTALL_CMD)

frontend-run: ## Run the frontend application
	cd $(FRONTEND_DIR) && $(FRONTEND_INSTALL_CMD) && npm run serve

frontend-test: ## Run frontend tests
	cd $(FRONTEND_DIR) && npm run test

frontend-test-watch: ## Run frontend tests in watch mode
	cd $(FRONTEND_DIR) && npm run test:watch

clean: ## Clean the build artifacts
	rm -rf bin/
	rm -rf $(FRONTEND_DIR)/dist
