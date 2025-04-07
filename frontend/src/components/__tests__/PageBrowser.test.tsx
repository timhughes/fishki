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

describe('PageBrowser', () => {
  const mockOnFileSelect = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
    
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
    
    // Now it should show the root node and its children
    expect(screen.getByText('wiki-repo')).toBeInTheDocument();
    expect(screen.getByText('folder')).toBeInTheDocument();
    expect(screen.getByText('page2')).toBeInTheDocument();
  });
  
  test('clicking on root node navigates to root index', async () => {
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
    
    // Click on the root node
    await act(async () => {
      fireEvent.click(screen.getByText('wiki-repo'));
    });
    
    // Verify navigation to root index
    expect(mockNavigate).toHaveBeenCalledWith('/page/index');
  });
  
  test('clicking on a file calls onFileSelect with the correct path', async () => {
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
    
    // Click on the file
    await act(async () => {
      fireEvent.click(screen.getByText('page2'));
    });
    
    // Verify onFileSelect was called with the correct path
    expect(mockOnFileSelect).toHaveBeenCalledWith('page2.md');
  });
  
  test('clicking on a folder navigates to the folder path', async () => {
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
            { path: 'folder', type: 'folder', name: 'folder' }
          ]
        }
      ]);
    });
    
    // Click on the folder
    await act(async () => {
      fireEvent.click(screen.getByText('folder'));
    });
    
    // Verify navigation to folder path
    expect(mockNavigate).toHaveBeenCalledWith('/page/folder/');
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
