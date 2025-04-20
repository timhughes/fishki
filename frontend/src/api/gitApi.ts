import { api } from './client';

export interface RemoteStatus {
  hasRemote: boolean;
  branchName: string;
  aheadCount: number;
  behindCount: number;
  modifiedCount: number;
  untrackedCount: number;
  lastFetched?: number; // Timestamp of last fetch
}

class GitApi {
  private lastFetchTime: number = 0;
  private fetchInterval: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  private errorRetryCount: number = 0;
  private maxRetries: number = 3;

  async getStatus(): Promise<RemoteStatus> {
    try {
      const response = await api.getStatus();
      // Reset error counter on success
      this.errorRetryCount = 0;
      
      return {
        hasRemote: true,
        branchName: response.branch || 'main',
        aheadCount: response.ahead || 0,
        behindCount: response.behind || 0,
        modifiedCount: response.modified || 0,
        untrackedCount: response.untracked || 0,
        lastFetched: this.lastFetchTime
      };
    } catch (error) {
      console.error('Failed to fetch Git status:', error);
      this.errorRetryCount++;
      
      // Return a default status if we can't fetch
      return {
        hasRemote: false,
        branchName: 'unknown',
        aheadCount: 0,
        behindCount: 0,
        modifiedCount: 0,
        untrackedCount: 0,
        lastFetched: this.lastFetchTime
      };
    }
  }

  async pull(): Promise<void> {
    try {
      await api.pull();
      // Update fetch time after successful pull
      this.lastFetchTime = Date.now();
      // Reset error counter on success
      this.errorRetryCount = 0;
    } catch (error) {
      console.error('Failed to pull:', error);
      this.errorRetryCount++;
      throw error;
    }
  }

  async push(): Promise<void> {
    try {
      await api.push();
      // Reset error counter on success
      this.errorRetryCount = 0;
    } catch (error) {
      console.error('Failed to push:', error);
      this.errorRetryCount++;
      throw error;
    }
  }

  async fetch(): Promise<void> {
    try {
      await api.fetch();
      this.lastFetchTime = Date.now();
      // Reset error counter on success
      this.errorRetryCount = 0;
    } catch (error) {
      console.error('Failed to fetch:', error);
      this.errorRetryCount++;
      throw error;
    }
  }

  // Check if we should fetch based on time interval
  shouldFetch(): boolean {
    // Don't auto-fetch if we've had too many errors
    if (this.errorRetryCount >= this.maxRetries) {
      return false;
    }
    return Date.now() - this.lastFetchTime > this.fetchInterval;
  }

  // Set custom fetch interval (in milliseconds)
  setFetchInterval(interval: number): void {
    this.fetchInterval = interval;
  }
  
  // Reset error counter
  resetErrorCounter(): void {
    this.errorRetryCount = 0;
  }
}

export const gitApi = new GitApi();
