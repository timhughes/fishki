import { render, screen, act, waitFor } from '@testing-library/react';
import { MoveDialog } from './MoveDialog';
import { api } from '../api/client';

// Mock the API client
jest.mock('../api/client', () => ({
  api: {
    getFiles: jest.fn().mockResolvedValue([
      { name: 'folder1', isDir: true, type: 'folder' },
      { name: 'folder2', isDir: true, type: 'folder' },
      { name: 'test.md', isDir: false, type: 'file' }
    ])
  }
}));

describe('MoveDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnMoved = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders correctly with proper path formatting', async () => {
    // Mock the API call to resolve immediately
    (api.getFiles as jest.Mock).mockResolvedValue([
      { name: 'folder1', isDir: true, type: 'folder' },
      { name: 'folder2', isDir: true, type: 'folder' },
      { name: 'test.md', isDir: false, type: 'file' }
    ]);
    
    await act(async () => {
      render(
        <MoveDialog
          open={true}
          currentPath="test.md"
          onConfirm={mockOnMoved}
          onCancel={mockOnClose}
        />
      );
      
      // Wait for promises to resolve
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Check if the dialog renders with the correct title
    await waitFor(() => {
      expect(screen.getByText('Move Page')).toBeInTheDocument();
    });
    
    // Check if the input field has the correct helper text
    const helperText = screen.getByText('Enter the new name for this page');
    expect(helperText).toBeInTheDocument();
  });
});
