import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { GitStatusBar } from '../GitStatusBar';
import { gitApi } from '../../api/gitApi';
import { format } from 'date-fns';

// Mock the gitApi
jest.mock('../../api/gitApi', () => ({
  gitApi: {
    getStatus: jest.fn(),
    pull: jest.fn(),
    push: jest.fn(),
    fetch: jest.fn(),
    shouldFetch: jest.fn().mockReturnValue(false)
  }
}));

// Mock date-fns to avoid time-based test failures
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn().mockReturnValue('5 minutes')
}));

describe('GitStatusBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (gitApi.getStatus as jest.Mock).mockResolvedValue({
      hasRemote: true,
      branchName: 'main',
      aheadCount: 0,
      behindCount: 0,
      modifiedCount: 0,
      untrackedCount: 0,
      lastFetched: Date.now()
    });
  });

  test('renders branch name when status is loaded', async () => {
    render(<GitStatusBar />);
    
    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument();
    });
    
    expect(gitApi.getStatus).toHaveBeenCalledTimes(1);
  });

  test('shows pull button when behind remote', async () => {
    (gitApi.getStatus as jest.Mock).mockResolvedValue({
      hasRemote: true,
      branchName: 'main',
      aheadCount: 0,
      behindCount: 2,
      modifiedCount: 0,
      untrackedCount: 0,
      lastFetched: Date.now()
    });
    
    render(<GitStatusBar />);
    
    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument();
    });
    
    // Find the pull button using the data-testid
    const pullButton = await screen.findByTestId('pull-button');
    expect(pullButton).toBeInTheDocument();
    expect(pullButton).toHaveAttribute('aria-label', 'Pull 2 commits');
  });

  test('shows push button when ahead of remote', async () => {
    (gitApi.getStatus as jest.Mock).mockResolvedValue({
      hasRemote: true,
      branchName: 'main',
      aheadCount: 3,
      behindCount: 0,
      modifiedCount: 0,
      untrackedCount: 0,
      lastFetched: Date.now()
    });
    
    render(<GitStatusBar />);
    
    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument();
    });
    
    // Find the push button using the data-testid
    const pushButton = await screen.findByTestId('push-button');
    expect(pushButton).toBeInTheDocument();
    expect(pushButton).toHaveAttribute('aria-label', 'Push 3 commits');
  });

  test('shows local changes indicator', async () => {
    (gitApi.getStatus as jest.Mock).mockResolvedValue({
      hasRemote: true,
      branchName: 'main',
      aheadCount: 0,
      behindCount: 0,
      modifiedCount: 2,
      untrackedCount: 1,
      lastFetched: Date.now()
    });
    
    render(<GitStatusBar />);
    
    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument();
    });
    
    expect(screen.getByText('3 local changes')).toBeInTheDocument();
  });

  test('shows fetch button and performs fetch operation', async () => {
    render(<GitStatusBar />);
    
    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument();
    });
    
    // Find the fetch button (it has a refresh icon)
    const fetchButton = screen.getByRole('button', { name: /last fetched 5 minutes ago/i });
    expect(fetchButton).toBeInTheDocument();
    
    // Click the fetch button
    fireEvent.click(fetchButton);
    
    // Verify fetch was called
    expect(gitApi.fetch).toHaveBeenCalledTimes(1);
    
    // After fetch, status should be refreshed
    await waitFor(() => {
      expect(gitApi.getStatus).toHaveBeenCalledTimes(2);
    });
  });

  test('handles pull operation', async () => {
    (gitApi.getStatus as jest.Mock).mockResolvedValue({
      hasRemote: true,
      branchName: 'main',
      aheadCount: 0,
      behindCount: 2,
      modifiedCount: 0,
      untrackedCount: 0,
      lastFetched: Date.now()
    });
    
    render(<GitStatusBar />);
    
    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument();
    });
    
    // Find and click the pull button using data-testid
    const pullButton = await screen.findByTestId('pull-button');
    fireEvent.click(pullButton);
    
    // Verify pull was called
    expect(gitApi.pull).toHaveBeenCalledTimes(1);
    
    // After pull, status should be refreshed
    await waitFor(() => {
      expect(gitApi.getStatus).toHaveBeenCalledTimes(2);
    });
  });

  test('handles push operation', async () => {
    (gitApi.getStatus as jest.Mock).mockResolvedValue({
      hasRemote: true,
      branchName: 'main',
      aheadCount: 3,
      behindCount: 0,
      modifiedCount: 0,
      untrackedCount: 0,
      lastFetched: Date.now()
    });
    
    render(<GitStatusBar />);
    
    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument();
    });
    
    // Find and click the push button using data-testid
    const pushButton = await screen.findByTestId('push-button');
    fireEvent.click(pushButton);
    
    // Verify push was called
    expect(gitApi.push).toHaveBeenCalledTimes(1);
    
    // After push, status should be refreshed
    await waitFor(() => {
      expect(gitApi.getStatus).toHaveBeenCalledTimes(2);
    });
  });
});
