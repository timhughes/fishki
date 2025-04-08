import { renderHook, act } from '@testing-library/react';
import { useFolders } from '../useFolders';
import { api } from '../../api/client';

// Mock the API client
jest.mock('../../api/client', () => ({
  api: {
    getFiles: jest.fn()
  }
}));

describe('useFolders hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('returns initial state', () => {
    const { result } = renderHook(() => useFolders(false));
    
    expect(result.current).toEqual({
      folders: [],
      loading: false,
      error: ''
    });
    
    // API should not be called when shouldFetch is false
    expect(api.getFiles).not.toHaveBeenCalled();
  });
  
  test('fetches folders when shouldFetch is true', async () => {
    // Mock API response
    (api.getFiles as jest.Mock).mockResolvedValue([
      {
        name: 'repo',
        type: 'folder',
        path: '',
        children: [
          {
            name: 'folder1',
            type: 'folder',
            path: 'folder1',
            children: []
          },
          {
            name: 'folder2',
            type: 'folder',
            path: 'folder2',
            children: []
          }
        ]
      }
    ]);
    
    // Render hook with shouldFetch = true
    const { result } = renderHook(() => useFolders(true));
    
    // Initial state should show loading
    expect(result.current.loading).toBe(true);
    
    // Wait for the API call to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // API should have been called
    expect(api.getFiles).toHaveBeenCalled();
    
    // Final state should include folders and not be loading
    expect(result.current).toEqual({
      folders: ['', 'folder1', 'folder2'],
      loading: false,
      error: ''
    });
  });
  
  test('handles API errors', async () => {
    // Mock API error
    (api.getFiles as jest.Mock).mockRejectedValue(new Error('API error'));
    
    // Render hook with shouldFetch = true
    const { result } = renderHook(() => useFolders(true));
    
    // Wait for the API call to reject
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Final state should include error and not be loading
    expect(result.current).toEqual({
      folders: [],
      loading: false,
      error: 'Failed to load folders'
    });
  });
  
  test('updates when shouldFetch changes', async () => {
    // Mock API response
    (api.getFiles as jest.Mock).mockResolvedValue([
      {
        name: 'repo',
        type: 'folder',
        path: '',
        children: [
          {
            name: 'folder1',
            type: 'folder',
            path: 'folder1',
            children: []
          }
        ]
      }
    ]);
    
    // Start with shouldFetch = false
    const { result, rerender } = renderHook(
      (props) => useFolders(props.shouldFetch),
      { initialProps: { shouldFetch: false } }
    );
    
    // API should not be called initially
    expect(api.getFiles).not.toHaveBeenCalled();
    
    // Change to shouldFetch = true
    rerender({ shouldFetch: true });
    
    // Wait for the API call to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // API should have been called
    expect(api.getFiles).toHaveBeenCalled();
    
    // Final state should include folders
    expect(result.current.folders).toContain('folder1');
  });
});
