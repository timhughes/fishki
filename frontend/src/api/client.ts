export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class ApiClient {
  private csrfToken: string | null = null;

  private async request(url: string, options: RequestInit = {}) {
    // For state-changing operations, ensure we have a CSRF token
    if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
      // Get CSRF token if we don't have one
      if (!this.csrfToken) {
        await this.fetchCsrfToken();
      }
      
      // Add CSRF token to headers
      if (this.csrfToken) {
        options.headers = {
          ...options.headers,
          'X-CSRF-Token': this.csrfToken
        };
      }
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'same-origin', // Include cookies in requests
    });

    if (!response.ok) {
      const message = await response.text();
      throw new ApiError(
        response.status,
        message || `API request failed: ${response.statusText}`
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  private async fetchCsrfToken() {
    try {
      const response = await fetch('/api/csrf-token', {
        credentials: 'same-origin', // Include cookies in request
      });
      
      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrfToken;
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  }

  async getFiles() {
    const response = await this.request('/api/files');
    return response.files;
  }

  async load(filename: string) {
    // Don't attempt to load paths ending with / directly
    if (filename.endsWith('/')) {
      throw new ApiError(400, 'Cannot load a directory directly');
    }
    
    // Sanitize the filename
    const sanitizedFilename = this.sanitizePath(filename);
    
    try {
      return await this.request(`/api/load?filename=${encodeURIComponent(sanitizedFilename)}`);
    } catch (err) {
      // Standardize 404 errors to ensure they're properly caught by components
      if (err instanceof ApiError && err.status === 404) {
        const standardError = new ApiError(404, '404');
        throw standardError;
      }
      throw err;
    }
  }

  async init(path: string) {
    return this.request('/api/init', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }

  async getConfig() {
    return this.request('/api/config');
  }

  async setConfig(wikiPath: string) {
    return this.request('/api/config', {
      method: 'POST',
      body: JSON.stringify({ wikiPath }),
    });
  }

  async save(filename: string, content: string) {
    // Sanitize the filename
    const sanitizedFilename = this.sanitizePath(filename);
    
    return this.request('/api/save', {
      method: 'POST',
      body: JSON.stringify({ filename: sanitizedFilename, content }),
    });
  }

  async getStatus() {
    return this.request('/api/status');
  }

  async render(markdown: string) {
    return this.request('/api/render', {
      method: 'POST',
      body: JSON.stringify({ markdown }),
    });
  }

  async delete(filename: string) {
    // Sanitize the filename
    const sanitizedFilename = this.sanitizePath(filename);
    
    return this.request('/api/delete', {
      method: 'DELETE',
      body: JSON.stringify({ filename: sanitizedFilename }),
    });
  }
  
  async rename(oldPath: string, newPath: string) {
    // Sanitize both paths
    const sanitizedOldPath = this.sanitizePath(oldPath);
    const sanitizedNewPath = this.sanitizePath(newPath);
    
    // First load the content from the old file
    const content = await this.load(sanitizedOldPath);
    
    // Then save it to the new location
    await this.save(sanitizedNewPath, content);
    
    // Finally delete the old file
    await this.delete(sanitizedOldPath);
    
    return { success: true };
  }

  // Helper method to sanitize paths
  private sanitizePath(path: string): string {
    // Remove any leading slashes
    let sanitized = path.replace(/^\/+/, '');
    
    // Remove any attempts to navigate up directories
    sanitized = sanitized.replace(/\.\.\//g, '');
    
    return sanitized;
  }
}

export const api = new ApiClient();
