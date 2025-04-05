import { ApiClient } from '../client';
import { FileInfo } from '../../types/api';

describe('ApiClient', () => {
  let client: ApiClient;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    client = new ApiClient();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('initializes with default base URL', () => {
    expect(client).toBeInstanceOf(ApiClient);
  });

  describe('init', () => {
    it('sends correct init request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('')
      });

      await client.init('/path/to/wiki');

      expect(mockFetch).toHaveBeenCalledWith('/api/init', {
        method: 'POST',
        body: JSON.stringify({ path: '/path/to/wiki' }),
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });

  describe('getFiles', () => {
    it('returns file tree', async () => {
      const mockFiles: FileInfo[] = [
        {
          name: 'folder1',
          type: 'folder',
          path: 'folder1',
          children: [
            {
              name: 'file1.md',
              type: 'file',
              path: 'folder1/file1.md'
            }
          ]
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ files: mockFiles })
      });

      const result = await client.getFiles();

      expect(result).toEqual(mockFiles);
      expect(mockFetch).toHaveBeenCalledWith('/api/files', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });

  describe('error handling', () => {
    it('throws ApiError on non-ok response', async () => {
      const errorMessage = 'Not Found';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(errorMessage)
      });

      await expect(client.getFiles()).rejects.toMatchObject({
        message: errorMessage,
        status: 404,
        name: 'ApiError'
      });
    });
  });

  describe('content type handling', () => {
    it('handles text responses', async () => {
      const mockStatus = 'On branch main';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve(mockStatus)
      });

      const result = await client.getStatus();

      expect(result).toBe(mockStatus);
    });

    it('handles HTML responses', async () => {
      const mockHtml = '<p>rendered markdown</p>';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve(mockHtml)
      });

      const result = await client.render('# markdown');

      expect(result).toBe(mockHtml);
    });
  });
});
