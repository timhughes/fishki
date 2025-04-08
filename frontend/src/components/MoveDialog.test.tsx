import { render, screen, fireEvent } from '@testing-library/react';
import { MoveDialog } from './MoveDialog';
import * as useFoldersModule from '../hooks/useFolders';

// Mock the useFolders hook
jest.mock('../hooks/useFolders', () => ({
  useFolders: jest.fn()
}));

describe('MoveDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnMoved = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for useFolders
    (useFoldersModule.useFolders as jest.Mock).mockReturnValue({
      folders: ['folder1', 'folder2', 'folder3'],
      loading: false,
      error: ''
    });
  });
  
  test('renders correctly with proper path formatting', () => {
    // Render component
    render(
      <MoveDialog
        open={true}
        currentPath="test.md"
        onConfirm={mockOnMoved}
        onCancel={mockOnClose}
      />
    );
    
    // Check if the dialog renders with the correct title
    expect(screen.getByText('Move Page')).toBeInTheDocument();
    
    // Check if the input field has the correct helper text
    const helperText = screen.getByText('Enter the new name for this page');
    expect(helperText).toBeInTheDocument();
  });
  
  test('calls onConfirm when Move button is clicked', () => {
    // Mock implementation that resolves immediately
    mockOnMoved.mockImplementation(() => Promise.resolve());
    
    render(
      <MoveDialog
        open={true}
        currentPath="test.md"
        onConfirm={mockOnMoved}
        onCancel={mockOnClose}
      />
    );
    
    // Change the name to trigger a different path
    fireEvent.change(screen.getByLabelText('New Page Name'), {
      target: { value: 'new-test' }
    });
    
    // Click the Move button
    fireEvent.click(screen.getByRole('button', { name: 'Move' }));
    
    // Check if onConfirm was called with the correct path
    expect(mockOnMoved).toHaveBeenCalledWith('new-test.md');
  });
  
  test('calls onCancel when Cancel button is clicked', () => {
    render(
      <MoveDialog
        open={true}
        currentPath="test.md"
        onConfirm={mockOnMoved}
        onCancel={mockOnClose}
      />
    );
    
    // Click the Cancel button
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    
    // Check if onCancel was called
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  test('shows loading state when folders are loading', () => {
    // Mock loading state
    (useFoldersModule.useFolders as jest.Mock).mockReturnValue({
      folders: [],
      loading: true,
      error: ''
    });
    
    render(
      <MoveDialog
        open={true}
        currentPath="test.md"
        onConfirm={mockOnMoved}
        onCancel={mockOnClose}
      />
    );
    
    // Check if the Move button is disabled during loading
    const moveButton = screen.getByRole('button', { name: 'Move' });
    expect(moveButton).toBeDisabled();
  });
  
  test('shows error message when folder loading fails', () => {
    // Mock error state
    (useFoldersModule.useFolders as jest.Mock).mockReturnValue({
      folders: [],
      loading: false,
      error: 'Failed to load folders'
    });
    
    render(
      <MoveDialog
        open={true}
        currentPath="test.md"
        onConfirm={mockOnMoved}
        onCancel={mockOnClose}
      />
    );
    
    // Check if error message is displayed
    expect(screen.getByText('Failed to load folders')).toBeInTheDocument();
  });
});
