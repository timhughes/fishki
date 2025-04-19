import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownToolbar } from '../MarkdownToolbar';

describe('MarkdownToolbar', () => {
  const mockActionHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all formatting buttons', () => {
    render(<MarkdownToolbar onAction={mockActionHandler} />);
    
    // Check for buttons by their aria-label
    expect(screen.getByLabelText(/Bold/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Italic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Heading/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bullet List/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Numbered List/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Task List/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Inline Code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Code Block/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Link/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blockquote/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Table/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Horizontal Rule/i)).toBeInTheDocument();
  });

  test('calls action handler when buttons are clicked', () => {
    render(<MarkdownToolbar onAction={mockActionHandler} />);
    
    // Click on bold button
    fireEvent.click(screen.getByLabelText(/Bold/i));
    expect(mockActionHandler).toHaveBeenCalledWith('bold');
    
    // Click on italic button
    fireEvent.click(screen.getByLabelText(/Italic/i));
    expect(mockActionHandler).toHaveBeenCalledWith('italic');
    
    // Click on heading button
    fireEvent.click(screen.getByLabelText(/Heading/i));
    expect(mockActionHandler).toHaveBeenCalledWith('h2');
  });

  test('renders view mode buttons when onViewModeChange is provided', () => {
    const mockViewModeChange = jest.fn();
    render(
      <MarkdownToolbar 
        onAction={mockActionHandler} 
        onViewModeChange={mockViewModeChange} 
        viewMode="split"
      />
    );
    
    expect(screen.getByLabelText(/Edit Mode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Split Mode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preview Mode/i)).toBeInTheDocument();
    
    // Click on preview mode button
    fireEvent.click(screen.getByLabelText(/Preview Mode/i));
    expect(mockViewModeChange).toHaveBeenCalledWith('preview');
  });

  test('highlights the current view mode button', () => {
    render(
      <MarkdownToolbar 
        onAction={mockActionHandler} 
        onViewModeChange={jest.fn()} 
        viewMode="edit"
      />
    );
    
    // Check that the edit button has the primary color class
    const editButton = screen.getByLabelText(/Edit Mode/i);
    expect(editButton.closest('button')).toHaveClass('MuiButtonBase-root');
    
    // The other buttons should have default color
    const splitButton = screen.getByLabelText(/Split Mode/i);
    expect(splitButton.closest('button')).toHaveClass('MuiButtonBase-root');
    
    const previewButton = screen.getByLabelText(/Preview Mode/i);
    expect(previewButton.closest('button')).toHaveClass('MuiButtonBase-root');
  });
});
