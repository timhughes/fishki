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
    return this.request(`/api/load?filename=${encodeURIComponent(filename)}`);
  }

  async init(path: string) {
    return this.request('/api/init', {
      method: 'POST',
      body: JSON.stringify({ path }),
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
