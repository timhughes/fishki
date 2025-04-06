import { render, screen } from '@testing-library/react';
import { PageBrowser } from '../PageBrowser';

// Mock the API
jest.mock('../../api/client', () => ({
  api: {
    getFiles: jest.fn().mockResolvedValue([
      { path: 'folder/', type: 'directory', name: 'folder' },
      { path: 'folder/page1.md', type: 'file', name: 'page1.md' },
      { path: 'page2.md', type: 'file', name: 'page2.md' }
    ])
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
  
  test('renders loading state initially', () => {
    render(
      <PageBrowser 
        onFileSelect={mockOnFileSelect}
        selectedFile=""
        refreshTrigger={0}
      />
    );
    
    // Check if loading state is shown
    expect(screen.getByText('Loading files...')).toBeInTheDocument();
  });
});
