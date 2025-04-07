import { ApiClient } from '../api/client';

describe('ApiClient', () => {
  let client: ApiClient;
  
  beforeEach(() => {
    client = new ApiClient();
    
    // Mock the fileExists method
    client.fileExists = jest.fn();
  });
  
  describe('rename method error formatting', () => {
    test('adds leading slash to error message path', async () => {
      // Setup the fileExists method to return true
      (client.fileExists as jest.Mock).mockResolvedValue(true);
      
      // Call the rename method with a path that doesn't have a leading slash
      try {
        await client.rename('old/path.md', 'folder/file.md');
        fail('Expected an error to be thrown');
      } catch (error) {
        expect((error as Error).message).toContain('A page already exists at /folder/file');
      }
    });
    
    test('preserves existing leading slash in error message path', async () => {
      // Setup the fileExists method to return true
      (client.fileExists as jest.Mock).mockResolvedValue(true);
      
      // Call the rename method with a path that already has a leading slash
      try {
        await client.rename('old/path.md', '/folder/file.md');
        fail('Expected an error to be thrown');
      } catch (error) {
        expect((error as Error).message).toContain('A page already exists at /folder/file');
      }
    });
  });
});
