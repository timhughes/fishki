import { render, screen, fireEvent } from '@testing-library/react';
import { RenameDialog } from '../RenameDialog';

describe('RenameDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders correctly when open', () => {
    render(
      <RenameDialog
        open={true}
        currentPath="test/path.md"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Check if dialog title is displayed
    expect(screen.getByText('Rename Page')).toBeInTheDocument();
    
    // Check if current path is displayed
    expect(screen.getByText('Current path:')).toBeInTheDocument();
    expect(screen.getByText('test/path.md')).toBeInTheDocument();
    
    // Check if input field is displayed with correct initial value
    const inputField = screen.getByLabelText('New Page Name');
    expect(inputField).toBeInTheDocument();
    expect(inputField).toHaveValue('path');
    
    // Check if buttons are displayed
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Rename')).toBeInTheDocument();
  });
  
  test('does not render when closed', () => {
    render(
      <RenameDialog
        open={false}
        currentPath="test/path.md"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Check that dialog is not rendered
    expect(screen.queryByText('Rename Page')).not.toBeInTheDocument();
  });
  
  test('calls onCancel when cancel button is clicked', () => {
    render(
      <RenameDialog
        open={true}
        currentPath="test/path.md"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));
    
    // Check if onCancel was called
    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
  
  test('calls onConfirm with new path when rename button is clicked', () => {
    render(
      <RenameDialog
        open={true}
        currentPath="test/path.md"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Change input value
    const inputField = screen.getByLabelText('New Page Name');
    fireEvent.change(inputField, { target: { value: 'new-path' } });
    
    // Click rename button
    fireEvent.click(screen.getByText('Rename'));
    
    // Check if onConfirm was called with correct path
    expect(mockOnConfirm).toHaveBeenCalledWith('test/new-path.md');
    expect(mockOnCancel).not.toHaveBeenCalled();
  });
  
  test('disables rename button when input is empty', () => {
    render(
      <RenameDialog
        open={true}
        currentPath="test/path.md"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Change input value to empty
    const inputField = screen.getByLabelText('New Page Name');
    fireEvent.change(inputField, { target: { value: '' } });
    
    // Check if rename button is disabled
    const renameButton = screen.getByText('Rename');
    expect(renameButton).toBeDisabled();
    
    // Try clicking the button
    fireEvent.click(renameButton);
    
    // Check that onConfirm was not called
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
  
  test('disables rename button when input contains slashes', () => {
    render(
      <RenameDialog
        open={true}
        currentPath="test/path.md"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Change input value to contain slashes
    const inputField = screen.getByLabelText('New Page Name');
    fireEvent.change(inputField, { target: { value: 'invalid/path' } });
    
    // Check if rename button is disabled
    const renameButton = screen.getByText('Rename');
    expect(renameButton).toBeDisabled();
    
    // Check if validation error is displayed
    expect(screen.getByText('Page name cannot contain slashes')).toBeInTheDocument();
  });
  
  test('displays error message when provided', () => {
    render(
      <RenameDialog
        open={true}
        currentPath="test/path.md"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        error="Failed to rename page"
      />
    );
    
    // Check if error message is displayed
    expect(screen.getByText('Failed to rename page')).toBeInTheDocument();
  });
  
  test('disables buttons when renaming is in progress', () => {
    render(
      <RenameDialog
        open={true}
        currentPath="test/path.md"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        renaming={true}
      />
    );
    
    // Check if buttons are disabled
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Renaming...')).toBeDisabled();
  });
});
