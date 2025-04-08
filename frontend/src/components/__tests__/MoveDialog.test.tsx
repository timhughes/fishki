import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MoveDialog } from '../MoveDialog';

// Mock the API
const mockGetFiles = jest.fn();
jest.mock('../../api/client', () => ({
  api: {
    getFiles: (...args: unknown[]) => mockGetFiles(...args),
  }
}));

// Mock the Select component to avoid MUI warnings
jest.mock('@mui/material/Select', () => {
  return {
    __esModule: true,
    default: ({ children, value, onChange, disabled, label }: {
      children: React.ReactNode;
      value: string;
      onChange: (event: any) => void;
      disabled?: boolean;
      label?: string;
    }) => {
      return (
        <div data-testid="mock-select">
          <label>{label}</label>
          <select 
            value={value} 
            onChange={onChange}
            disabled={disabled}
            data-testid="directory-select"
          >
            <option value="">/ (root)</option>
            <option value="folder1">folder1</option>
            <option value="folder2">folder2</option>
            <option value="folder2/subfolder">folder2/subfolder</option>
          </select>
          {children}
        </div>
      );
    }
  };
});

describe('MoveDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the API response
    mockGetFiles.mockResolvedValue([
      {
        name: 'folder1',
        path: 'folder1',
        type: 'folder',
        children: []
      },
      {
        name: 'folder2',
        path: 'folder2',
        type: 'folder',
        children: [
          {
            name: 'subfolder',
            path: 'folder2/subfolder',
            type: 'folder',
            children: []
          }
        ]
      }
    ]);
  });
  
  test('renders correctly when open', async () => {
    await act(async () => {
      render(
        <MoveDialog
          open={true}
          currentPath="test/path.md"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
    });
    
    // Check if dialog title is displayed
    expect(screen.getByText('Move Page')).toBeInTheDocument();
    
    // Check if current path is displayed
    expect(screen.getByText('Current path:')).toBeInTheDocument();
    
    // Check if input field is displayed with correct initial value
    const inputField = screen.getByLabelText('New Page Name');
    expect(inputField).toBeInTheDocument();
    expect(inputField).toHaveValue('path');
    
    // Wait for folders to load
    await waitFor(() => {
      expect(mockGetFiles).toHaveBeenCalled();
    });
    
    // Check if directory dropdown is displayed
    expect(screen.getByTestId('mock-select')).toBeInTheDocument();
    
    // Check if buttons are displayed
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Move')).toBeInTheDocument();
  });
  
  test('does not render when closed', async () => {
    await act(async () => {
      render(
        <MoveDialog
          open={false}
          currentPath="test/path.md"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
    });
    
    // Check that dialog is not rendered
    expect(screen.queryByText('Move Page')).not.toBeInTheDocument();
  });
  
  test('calls onCancel when cancel button is clicked', async () => {
    await act(async () => {
      render(
        <MoveDialog
          open={true}
          currentPath="test/path.md"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
    });
    
    // Click cancel button
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    
    // Check if onCancel was called
    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
  
  test('calls onConfirm with new path when move button is clicked', async () => {
    await act(async () => {
      render(
        <MoveDialog
          open={true}
          currentPath="test/path.md"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
    });
    
    // Wait for folders to load
    await waitFor(() => {
      expect(mockGetFiles).toHaveBeenCalled();
    });
    
    // Change input value
    const inputField = screen.getByLabelText('New Page Name');
    await act(async () => {
      fireEvent.change(inputField, { target: { value: 'new-path' } });
    });
    
    // Click move button
    await act(async () => {
      fireEvent.click(screen.getByText('Move'));
    });
    
    // Check if onConfirm was called with correct path
    expect(mockOnConfirm).toHaveBeenCalledWith('test/new-path.md');
    expect(mockOnCancel).not.toHaveBeenCalled();
  });
  
  test('disables move button when input is empty', async () => {
    await act(async () => {
      render(
        <MoveDialog
          open={true}
          currentPath="test/path.md"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
    });
    
    // Wait for folders to load
    await waitFor(() => {
      expect(mockGetFiles).toHaveBeenCalled();
    });
    
    // Change input value to empty
    const inputField = screen.getByLabelText('New Page Name');
    await act(async () => {
      fireEvent.change(inputField, { target: { value: '' } });
    });
    
    // Check if move button is disabled
    const moveButton = screen.getByText('Move');
    expect(moveButton).toBeDisabled();
    
    // Try clicking the button
    await act(async () => {
      fireEvent.click(moveButton);
    });
    
    // Check that onConfirm was not called
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
  
  test('disables move button when input contains slashes', async () => {
    await act(async () => {
      render(
        <MoveDialog
          open={true}
          currentPath="test/path.md"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
    });
    
    // Wait for folders to load
    await waitFor(() => {
      expect(mockGetFiles).toHaveBeenCalled();
    });
    
    // Change input value to contain slashes
    const inputField = screen.getByLabelText('New Page Name');
    await act(async () => {
      fireEvent.change(inputField, { target: { value: 'invalid/path' } });
    });
    
    // Check if move button is disabled
    const moveButton = screen.getByText('Move');
    expect(moveButton).toBeDisabled();
    
    // Check if validation error is displayed
    expect(screen.getByText('Page name cannot contain slashes')).toBeInTheDocument();
  });
  
  test('displays error message when provided', async () => {
    await act(async () => {
      render(
        <MoveDialog
          open={true}
          currentPath="test/path.md"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          error="Failed to move page"
        />
      );
    });
    
    // Check if error message is displayed
    expect(screen.getByText('Failed to move page')).toBeInTheDocument();
  });
  
  test('disables buttons when moving is in progress', async () => {
    await act(async () => {
      render(
        <MoveDialog
          open={true}
          currentPath="test/path.md"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          moving={true}
        />
      );
    });
    
    // Check if buttons are disabled
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Moving...')).toBeDisabled();
  });
});
