import { render, screen, fireEvent, act } from '@testing-library/react';
import { MarkdownViewer } from '../MarkdownViewer';
import { MemoryRouter } from 'react-router-dom';

// Mock the ThemeContext
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    mode: 'light',
    toggleTheme: jest.fn()
  })
}));

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
        <button onClick={onConfirm} data-testid="confirm-delete">Confirm Delete</button>
        <button onClick={onCancel} data-testid="cancel-delete">Cancel Delete</button>
      </div>
    ) : null
  )
}));

// Mock the MoveDialog component
jest.mock('../MoveDialog', () => ({
  MoveDialog: ({ 
    open, 
    onConfirm, 
    onCancel 
  }: { 
    open: boolean; 
    onConfirm: (newPath: string) => void; 
    onCancel: () => void;
    currentPath?: string;
    moving?: boolean;
    error?: string;
  }) => (
    open ? (
      <div data-testid="move-dialog">
        <button onClick={() => onConfirm('new-test.md')} data-testid="confirm-move">Confirm Move</button>
        <button onClick={onCancel} data-testid="cancel-move">Cancel Move</button>
      </div>
    ) : null
  )
}));

// Mock the API with controlled promises
const mockLoad = jest.fn();
const mockDelete = jest.fn();
const mockRender = jest.fn();
const mockRename = jest.fn();

jest.mock('../../api/client', () => ({
  api: {
    load: (...args: unknown[]) => mockLoad(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    render: (...args: unknown[]) => mockRender(...args),
    rename: (...args: unknown[]) => mockRename(...args)
  }
}));

// Mock ReactMarkdown to avoid issues with ESM imports
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => {
    return <div data-testid="markdown-content">{children}</div>;
  }
}));

// Mock React Router's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock the plugins
jest.mock('remark-gfm', () => () => null);
jest.mock('rehype-raw', () => () => null);
jest.mock('rehype-sanitize', () => () => null);
jest.mock('rehype-highlight', () => () => null);

describe('MarkdownViewer', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnRename = jest.fn();
  const mockOnNotFound = jest.fn().mockReturnValue(<div>Not Found</div>);
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockLoad.mockResolvedValue('# Test Content');
    mockDelete.mockResolvedValue({});
    mockRender.mockResolvedValue('<h1>Test Content</h1>');
    mockRename.mockResolvedValue({ success: true });
  });
  
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    );
  };
  
  test('loads and displays content', async () => {
    let resolveLoad: ((value: string) => void) | undefined;
    mockLoad.mockImplementation(() => new Promise<string>(resolve => {
      resolveLoad = resolve;
    }));
    
    await act(async () => {
      renderWithRouter(
        <MarkdownViewer 
          filePath="test.md"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onNotFound={mockOnNotFound}
          onRename={mockOnRename}
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
      renderWithRouter(
        <MarkdownViewer 
          filePath="test.md"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onNotFound={mockOnNotFound}
          onRename={mockOnRename}
        />
      );
    });
    
    // Find and click the edit button by text content
    const editButton = await screen.findByText('Edit');
    await act(async () => {
      fireEvent.click(editButton);
    });
    
    // Check if onEdit was called
    expect(mockOnEdit).toHaveBeenCalled();
  });
  
  test('opens delete dialog when delete button is clicked', async () => {
    await act(async () => {
      renderWithRouter(
        <MarkdownViewer 
          filePath="test.md"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onNotFound={mockOnNotFound}
          onRename={mockOnRename}
        />
      );
    });
    
    // Find and click the delete button by text content
    const deleteButton = await screen.findByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    
    // Check if delete dialog is shown
    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
  });
  
  test('calls onDelete when delete is confirmed', async () => {
    await act(async () => {
      renderWithRouter(
        <MarkdownViewer 
          filePath="test.md"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onNotFound={mockOnNotFound}
          onRename={mockOnRename}
        />
      );
    });
    
    // Open delete dialog
    const deleteButton = await screen.findByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    
    // Confirm deletion
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-delete'));
    });
    
    // Check if onDelete was called
    expect(mockDelete).toHaveBeenCalledWith('test.md');
    expect(mockOnDelete).toHaveBeenCalled();
  });
  
  test('opens move dialog when move button is clicked', async () => {
    await act(async () => {
      renderWithRouter(
        <MarkdownViewer 
          filePath="test.md"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onNotFound={mockOnNotFound}
          onRename={mockOnRename}
        />
      );
    });
    
    // Find and click the move button by text content
    const moveButton = await screen.findByText('Move');
    await act(async () => {
      fireEvent.click(moveButton);
    });
    
    // Check if move dialog is shown
    expect(screen.getByTestId('move-dialog')).toBeInTheDocument();
  });
  
  test('calls onRename and navigates when move is confirmed', async () => {
    await act(async () => {
      renderWithRouter(
        <MarkdownViewer 
          filePath="test.md"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onNotFound={mockOnNotFound}
          onRename={mockOnRename}
        />
      );
    });
    
    // Open move dialog
    const moveButton = await screen.findByText('Move');
    await act(async () => {
      fireEvent.click(moveButton);
    });
    
    // Confirm move
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-move'));
    });
    
    // Check if rename API was called
    expect(mockRename).toHaveBeenCalledWith('test.md', 'new-test.md');
    
    // Check if onRename callback was called
    expect(mockOnRename).toHaveBeenCalledWith('test.md', 'new-test.md');
    
    // Check if navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/page/new-test');
  });
  
  test('calls onNotFound when file is not found', async () => {
    // Mock API to return 404
    mockLoad.mockRejectedValue(new Error('404'));
    
    await act(async () => {
      renderWithRouter(
        <MarkdownViewer 
          filePath="nonexistent.md"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onNotFound={mockOnNotFound}
          onRename={mockOnRename}
        />
      );
    });
    
    // Check if onNotFound was called
    expect(mockOnNotFound).toHaveBeenCalled();
  });
});
