import { render, screen, act } from '@testing-library/react';
import { PageBrowser } from '../PageBrowser';

// Create a controlled promise for API mocking
let resolveGetFiles: (value: any) => void;
const mockGetFilesPromise = new Promise(resolve => {
  resolveGetFiles = resolve;
});

// Mock the API with a controlled promise
jest.mock('../../api/client', () => ({
  api: {
    getFiles: jest.fn().mockImplementation(() => mockGetFilesPromise)
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
  
  test('renders files after loading', async () => {
    // Render component
    let renderResult: ReturnType<typeof render>;
    
    await act(async () => {
      renderResult = render(
        <PageBrowser 
          onFileSelect={mockOnFileSelect}
          selectedFile=""
          refreshTrigger={0}
        />
      );
    });
    
    // Initially, it should show loading state
    expect(renderResult!.container.textContent).toContain('Loading files');
    
    // Resolve the API call with data
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
});
