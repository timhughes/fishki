import { render, screen, act } from '@testing-library/react';
import { PageBrowser } from '../PageBrowser';

// Mock the API with a delayed response to ensure we can test the loading state
jest.mock('../../api/client', () => ({
  api: {
    getFiles: jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([
            { path: 'folder/', type: 'directory', name: 'folder' },
            { path: 'folder/page1.md', type: 'file', name: 'page1.md' },
            { path: 'page2.md', type: 'file', name: 'page2.md' }
          ]);
        }, 100);
      });
    })
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
    // Use fake timers to control setTimeout
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('renders files after loading', async () => {
    // Render component
    let container;
    await act(async () => {
      const renderResult = render(
        <PageBrowser 
          onFileSelect={mockOnFileSelect}
          selectedFile=""
          refreshTrigger={0}
        />
      );
      container = renderResult.container;
    });
    
    // Initially, it should show loading state
    expect(container.textContent).toContain('Loading files');
    
    // Fast-forward timers to resolve the API call
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    
    // Now it should show the files
    expect(screen.getByText('folder')).toBeInTheDocument();
    expect(screen.getByText('page1')).toBeInTheDocument();
    expect(screen.getByText('page2')).toBeInTheDocument();
  });
});
