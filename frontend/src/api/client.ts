export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class ApiClient {
  private async request(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      method: options.method || 'GET',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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

  async getFiles() {
    const response = await this.request('/api/files');
    return response.files;
  }

  async load(filename: string) {
    // Don't attempt to load paths ending with / directly
    if (filename.endsWith('/')) {
      throw new ApiError(400, 'Cannot load a directory directly');
    }
    
    try {
      return await this.request(`/api/load?filename=${encodeURIComponent(filename)}`);
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
    return this.request('/api/save', {
      method: 'POST',
      body: JSON.stringify({ filename, content }),
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
    return this.request('/api/delete', {
      method: 'DELETE',
      body: JSON.stringify({ filename }),
    });
  }
}

export const api = new ApiClient();
