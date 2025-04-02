import { ApiError, FileInfo, FilesResponse, InitRequest, RenderRequest, SaveRequest } from '../types/api';

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = {
        message: await response.text(),
        status: response.status,
      };
      throw error;
    }

    // Check if response is expected to be JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    // For text responses (like status or rendered markdown)
    const text = await response.text();
    return text as unknown as T;
  }

  /**
   * Initialize a new wiki at the specified path
   */
  async init(path: string): Promise<void> {
    const request: InitRequest = { path };
    await this.fetch('/init', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Pull changes from the remote repository
   */
  async pull(): Promise<void> {
    await this.fetch('/pull', { method: 'POST' });
  }

  /**
   * Push changes to the remote repository
   */
  async push(): Promise<void> {
    await this.fetch('/push', { method: 'POST' });
  }

  /**
   * Render markdown content to HTML
   */
  async render(markdown: string): Promise<string> {
    const request: RenderRequest = { markdown };
    return this.fetch<string>('/render', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Save content to a file
   */
  async save(filename: string, content: string): Promise<void> {
    const request: SaveRequest = { filename, content };
    await this.fetch('/save', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Load content from a file
   */
  async load(filename: string): Promise<string> {
    return this.fetch<string>(`/load?filename=${encodeURIComponent(filename)}`, {
      method: 'GET',
    });
  }

  /**
   * Get the file tree structure
   */
  async getFiles(): Promise<FileInfo[]> {
    const response = await this.fetch<FilesResponse>('/files', {
      method: 'GET',
    });
    return response.files;
  }

  /**
   * Get the current git status
   */
  async getStatus(): Promise<string> {
    return this.fetch<string>('/status', {
      method: 'GET',
    });
  }
}

// Create a default instance
export const api = new ApiClient();

// Export the class for custom instances
export default ApiClient;
