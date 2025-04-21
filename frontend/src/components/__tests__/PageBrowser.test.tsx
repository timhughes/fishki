import { render, screen, act, fireEvent } from '@testing-library/react';
import { PageBrowser } from '../PageBrowser';

// Create controlled promises for API mocking
let resolveGetFiles: (value: any) => void;
let resolveGetConfig: (value: any) => void;
const mockGetFilesPromise = new Promise(resolve => {
  resolveGetFiles = resolve;
});
const mockGetConfigPromise = new Promise(resolve => {
  resolveGetConfig = resolve;
});

// Mock the API with controlled promises
jest.mock('../../api/client', () => ({
  api: {
    getFiles: jest.fn().mockImplementation(() => mockGetFilesPromise),
    getConfig: jest.fn().mockImplementation(() => mockGetConfigPromise)
  }
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('PageBrowser', () => {
  const mockOnFileSelect = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });
  
  test('renders files with root node after loading with valid wiki path', async () => {
    // Render component
    render(
      <PageBrowser 
        onFileSelect={mockOnFileSelect}
        selectedFile=""
        refreshTrigger={0}
      />
    );
    
    // Initially, it should show loading state
    expect(screen.getByText(/Loading files/)).toBeInTheDocument();
    
    // Resolve the config API call first
    await act(async () => {
      resolveGetConfig({ wikiPath: '/test/wiki/path' });
    });
    
    // Then resolve the files API call with a root node structure
    await act(async () => {
      resolveGetFiles([
        { 
          path: '', 
          type: 'folder', 
          name: 'wiki-repo',
          children: [
            { path: 'folder', type: 'folder', name: 'folder' },
            { path: 'page2.md', type: 'file', name: 'page2.md' }
          ]
        }
      ]);
    });
    
    // Now it should show the root node
    expect(screen.getByText('wiki-repo')).toBeInTheDocument();
  });
  
  test('clicking on root node toggles folder expansion', async () => {
    // Render component
    render(
      <PageBrowser 
        onFileSelect={mockOnFileSelect}
        selectedFile=""
        refreshTrigger={0}
      />
    );
    
    // Resolve the API calls
    await act(async () => {
      resolveGetConfig({ wikiPath: '/test/wiki/path' });
      resolveGetFiles([
        { 
          path: '', 
          type: 'folder', 
          name: 'wiki-repo',
          children: [
            { path: 'page.md', type: 'file', name: 'page.md' }
          ]
        }
      ]);
    });
    
    // Verify localStorage was called to save expanded state
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
    
    // Click on the root node (wiki-repo)
    await act(async () => {
      fireEvent.click(screen.getByText('wiki-repo'));
    });
    
    // Verify localStorage was called again with updated expanded state
    expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
    
    // The second call should contain the updated expanded folders state
    const lastCall = mockLocalStorage.setItem.mock.calls[1];
    expect(lastCall[0]).toBe('fishki-expanded-folders');
    
    // Parse the JSON to verify the root folder state was toggled
    const savedState = JSON.parse(lastCall[1]);
    expect(savedState).toHaveProperty('root');
  });
  
  test('clicking on file calls onFileSelect with correct path', async () => {
    // Render component
    render(
      <PageBrowser 
        onFileSelect={mockOnFileSelect}
        selectedFile=""
        refreshTrigger={0}
      />
    );
    
    // Resolve the API calls
    await act(async () => {
      resolveGetConfig({ wikiPath: '/test/wiki/path' });
      resolveGetFiles([
        { 
          path: '', 
          type: 'folder', 
          name: 'wiki-repo',
          children: [
            { path: 'page2.md', type: 'file', name: 'page2.md' }
          ]
        }
      ]);
    });
    
    // Click on the file (page2)
    await act(async () => {
      fireEvent.click(screen.getByText('page2'));
    });
    
    // Verify onFileSelect was called with the correct path
    expect(mockOnFileSelect).toHaveBeenCalledWith('page2.md');
  });
  
  test('shows error when wiki path is not set', async () => {
    // Mock implementation for this specific test
    const { getConfig } = require('../../api/client').api;
    getConfig.mockImplementationOnce(() => Promise.resolve({ wikiPath: '' }));
    
    // Render component
    render(
      <PageBrowser 
        onFileSelect={mockOnFileSelect}
        selectedFile=""
        refreshTrigger={0}
      />
    );
    
    // Wait for the component to update
    await act(async () => {
      // Just wait for any promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Should show error about wiki path not set
    expect(screen.getByText('Wiki path not set')).toBeInTheDocument();
  });
});
