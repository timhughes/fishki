import { ApiClient } from '../client';
import { FileInfo } from '../../types/api';

// Mock the fetchCsrfToken method
jest.mock('../client', () => {
  const originalModule = jest.requireActual('../client');
  return {
    ...originalModule,
    ApiClient: class extends originalModule.ApiClient {
      fetchCsrfToken = jest.fn().mockResolvedValue(null);
    }
  };
});

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

      expect(mockFetch).toHaveBeenCalledWith('/api/init', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/path/to/wiki' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' })
      }));
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
      expect(mockFetch).toHaveBeenCalledWith('/api/files', expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' })
      }));
    });
  });

  describe('load', () => {
    it('rejects requests for directory paths', async () => {
      try {
        await client.load('folder/');
        fail('Expected an error to be thrown');
      } catch (err: any) {
        expect(err.status).toBe(400);
        expect(err.message).toBe('Cannot load a directory directly');
      }
      
      // Verify fetch was not called
      expect(mockFetch).not.toHaveBeenCalled();
    });
    
    it('standardizes 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('File not found'),
        headers: new Headers()
      });

      try {
        await client.load('nonexistent.md');
        fail('Expected an error to be thrown');
      } catch (err: any) {
        expect(err.status).toBe(404);
        expect(err.message).toBe('404');
      }
    });

    it('passes through other errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
        headers: new Headers()
      });

      try {
        await client.load('some-file.md');
        fail('Expected an error to be thrown');
      } catch (err: any) {
        expect(err.status).toBe(500);
        expect(err.message).toBe('Server error');
      }
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
