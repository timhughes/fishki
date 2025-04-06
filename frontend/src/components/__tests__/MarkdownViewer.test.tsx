import { render, screen, fireEvent, act } from '@testing-library/react';
import { MarkdownViewer } from '../MarkdownViewer';

// Mock the DeleteConfirmDialog component
jest.mock('../DeleteConfirmDialog', () => ({
  DeleteConfirmDialog: ({ 
    open, 
    onConfirm, 
    onCancel 
  }: { 
    open: boolean; 
    onConfirm: () => void; 
    onCancel: () => void;
    pagePath?: string;
    deleting?: boolean;
    error?: string;
  }) => (
    open ? (
      <div data-testid="delete-dialog">
        <button onClick={onConfirm}>Confirm Delete</button>
        <button onClick={onCancel}>Cancel Delete</button>
      </div>
    ) : null
  )
}));

// Mock the API with controlled promises
const mockLoad = jest.fn();
const mockDelete = jest.fn();
const mockRender = jest.fn();

jest.mock('../../api/client', () => ({
  api: {
    load: (...args: unknown[]) => mockLoad(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    render: (...args: unknown[]) => mockRender(...args)
  }
}));

// Mock ReactMarkdown to avoid issues with ESM imports
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => {
    return <div data-testid="markdown-content">{children}</div>;
  }
}));

// Mock the plugins
jest.mock('remark-gfm', () => () => null);
jest.mock('rehype-raw', () => () => null);
jest.mock('rehype-sanitize', () => () => null);
jest.mock('rehype-highlight', () => () => null);

describe('MarkdownViewer', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnNotFound = jest.fn().mockReturnValue(<div>Not Found</div>);
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockLoad.mockResolvedValue('# Test Content');
    mockDelete.mockResolvedValue({});
    mockRender.mockResolvedValue('<h1>Test Content</h1>');
  });
  
  test('loads and displays content', async () => {
    let resolveLoad: ((value: string) => void) | undefined;
    mockLoad.mockImplementation(() => new Promise<string>(resolve => {
      resolveLoad = resolve;
    }));
    
    await act(async () => {
      render(
        <MarkdownViewer 
          filePath="test.md"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onNotFound={mockOnNotFound}
        />
      );
    });
    
    // Initially it should show loading
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
    
    // Resolve the load promise
    await act(async () => {
      if (resolveLoad) {
        resolveLoad('# Test Content');
      }
    });
    
    // Check if content is displayed
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    expect(mockLoad).toHaveBeenCalledWith('test.md');
  });
  
  test('calls onEdit when edit button is clicked', async () => {
    await act(async () => {
      render(
        <MarkdownViewer 
          filePath="test.md"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onNotFound={mockOnNotFound}
        />
      );
    });
    
    // Find and click the edit button
    await act(async () => {
      fireEvent.click(screen.getByText('Edit'));
    });
    
    // Check if onEdit was called
    expect(mockOnEdit).toHaveBeenCalled();
  });
  
  test('opens delete dialog when delete button is clicked', async () => {
    await act(async () => {
      render(
        <MarkdownViewer 
          filePath="test.md"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onNotFound={mockOnNotFound}
        />
      );
    });
    
    // Find and click the delete button
    await act(async () => {
      fireEvent.click(screen.getByText('Delete'));
    });
    
    // Check if delete dialog is shown
    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
  });
  
  test('calls onDelete when delete is confirmed', async () => {
    await act(async () => {
      render(
        <MarkdownViewer 
          filePath="test.md"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onNotFound={mockOnNotFound}
        />
      );
    });
    
    // Open delete dialog
    await act(async () => {
      fireEvent.click(screen.getByText('Delete'));
    });
    
    // Confirm deletion
    await act(async () => {
      fireEvent.click(screen.getByText('Confirm Delete'));
    });
    
    // Check if onDelete was called
    expect(mockDelete).toHaveBeenCalledWith('test.md');
    expect(mockOnDelete).toHaveBeenCalled();
  });
  
  test('calls onNotFound when file is not found', async () => {
    // Mock API to return 404
    mockLoad.mockRejectedValue(new Error('404'));
    
    await act(async () => {
      render(
        <MarkdownViewer 
          filePath="nonexistent.md"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onNotFound={mockOnNotFound}
        />
      );
    });
    
    // Check if onNotFound was called
    expect(mockOnNotFound).toHaveBeenCalled();
  });
});
