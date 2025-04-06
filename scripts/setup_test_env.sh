#!/bin/bash

# Create the dist directory if it doesn't exist
mkdir -p frontend/dist

# Create a minimal index.html file if it doesn't exist
if [ ! -f frontend/dist/index.html ]; then
  echo '<!DOCTYPE html><html><head><title>Test Environment</title></head><body>Test Environment</body></html>' > frontend/dist/index.html
fi

# Set the GO_TESTING environment variable
export GO_TESTING=1
