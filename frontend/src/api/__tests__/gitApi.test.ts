import { gitApi } from '../gitApi';
import { api } from '../client';

// Mock the API client
jest.mock('../client', () => ({
  api: {
    getStatus: jest.fn(),
    pull: jest.fn(),
    push: jest.fn(),
    fetch: jest.fn()
  }
}));

describe('gitApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset lastFetchTime
    (gitApi as any).lastFetchTime = 0;
    (gitApi as any).fetchInterval = 5 * 60 * 1000; // 5 minutes
  });

  describe('getStatus', () => {
    test('returns status from API when successful', async () => {
      (api.getStatus as jest.Mock).mockResolvedValue({
        branch: 'main',
        ahead: 2,
        behind: 3,
        modified: 1,
        untracked: 4
      });

      const result = await gitApi.getStatus();
      
      expect(result).toEqual({
        hasRemote: true,
        branchName: 'main',
        aheadCount: 2,
        behindCount: 3,
        modifiedCount: 1,
        untrackedCount: 4,
        lastFetched: 0
      });
      
      expect(api.getStatus).toHaveBeenCalledTimes(1);
    });

    test('returns default status when API fails', async () => {
      (api.getStatus as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await gitApi.getStatus();
      
      expect(result).toEqual({
        hasRemote: false,
        branchName: 'unknown',
        aheadCount: 0,
        behindCount: 0,
        modifiedCount: 0,
        untrackedCount: 0,
        lastFetched: 0
      });
      
      expect(api.getStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('pull', () => {
    test('calls API and updates lastFetchTime', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      await gitApi.pull();
      
      expect(api.pull).toHaveBeenCalledTimes(1);
      expect((gitApi as any).lastFetchTime).toBe(now);
    });

    test('throws error when API fails', async () => {
      (api.pull as jest.Mock).mockRejectedValue(new Error('Pull error'));
      
      await expect(gitApi.pull()).rejects.toThrow('Pull error');
      expect((gitApi as any).lastFetchTime).toBe(0); // Should not update on error
    });
  });

  describe('push', () => {
    test('calls API successfully', async () => {
      await gitApi.push();
      
      expect(api.push).toHaveBeenCalledTimes(1);
    });

    test('throws error when API fails', async () => {
      (api.push as jest.Mock).mockRejectedValue(new Error('Push error'));
      
      await expect(gitApi.push()).rejects.toThrow('Push error');
    });
  });

  describe('fetch', () => {
    test('calls API and updates lastFetchTime', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      await gitApi.fetch();
      
      expect(api.fetch).toHaveBeenCalledTimes(1);
      expect((gitApi as any).lastFetchTime).toBe(now);
    });

    test('throws error when API fails', async () => {
      (api.fetch as jest.Mock).mockRejectedValue(new Error('Fetch error'));
      
      await expect(gitApi.fetch()).rejects.toThrow('Fetch error');
      expect((gitApi as any).lastFetchTime).toBe(0); // Should not update on error
    });
  });

  describe('shouldFetch', () => {
    test('returns true when fetch interval has passed', () => {
      // Set last fetch time to 6 minutes ago
      const sixMinutesAgo = Date.now() - 6 * 60 * 1000;
      (gitApi as any).lastFetchTime = sixMinutesAgo;
      
      expect(gitApi.shouldFetch()).toBe(true);
    });

    test('returns false when fetch interval has not passed', () => {
      // Set last fetch time to 4 minutes ago
      const fourMinutesAgo = Date.now() - 4 * 60 * 1000;
      (gitApi as any).lastFetchTime = fourMinutesAgo;
      
      expect(gitApi.shouldFetch()).toBe(false);
    });

    test('returns true when never fetched before', () => {
      (gitApi as any).lastFetchTime = 0;
      
      expect(gitApi.shouldFetch()).toBe(true);
    });
  });

  describe('setFetchInterval', () => {
    test('updates fetch interval', () => {
      gitApi.setFetchInterval(10 * 60 * 1000); // 10 minutes
      
      expect((gitApi as any).fetchInterval).toBe(10 * 60 * 1000);
    });
  });
});
