import { render, screen, act } from '@testing-library/react';
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
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

describe('PageBrowser', () => {
  const mockOnFileSelect = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders files after loading with valid wiki path', async () => {
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
    
    // Then resolve the files API call
    await act(async () => {
      resolveGetFiles([
        { path: 'folder/', type: 'directory', name: 'folder' },
        { path: 'folder/page1.md', type: 'file', name: 'page1.md' },
        { path: 'page2.md', type: 'file', name: 'page2.md' }
      ]);
    });
    
    // Now it should show the files
    expect(screen.getByText('folder')).toBeInTheDocument();
    expect(screen.getByText('page1')).toBeInTheDocument();
    expect(screen.getByText('page2')).toBeInTheDocument();
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
