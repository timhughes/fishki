class ApiClient {
  private async request(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('404');
      }
      const message = await response.text();
      throw new Error(message || `API request failed: ${response.statusText}`);
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

  async save(filename: string, content: string) {
    return this.request('/api/save', {
      method: 'POST',
      body: JSON.stringify({ filename, content }),
    });
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
