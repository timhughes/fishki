import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavigationProvider } from '../contexts/NavigationContext';
import App from '../App';
import { api } from '../api/client';

// Mock the API client
jest.mock('../api/client', () => ({
  api: {
    load: jest.fn(),
    save: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    getFiles: jest.fn().mockResolvedValue([
      {
        name: 'docs',
        type: 'folder',
        path: 'docs',
        children: [
          {
            name: 'page1.md',
            type: 'file',
            path: 'docs/page1.md'
          },
          {
            name: 'page2.md',
            type: 'file',
            path: 'docs/page2.md'
          }
        ]
      },
      {
        name: 'page3.md',
        type: 'file',
        path: 'page3.md'
      }
    ]),
    render: jest.fn().mockResolvedValue('<h1>Test Content</h1>'),
  },
}));

// Mock components to simplify testing
jest.mock('../components/MarkdownViewer', () => {
  const { useState } = require('react');
  
  return {
    MarkdownViewer: ({ filePath, onEdit, onDelete, onNotFound }: {
      filePath: string;
      onEdit: () => void;
      onDelete: () => void;
      onNotFound: () => React.ReactNode;
    }) => {
      const [isDeleted, setIsDeleted] = useState(false);
      
      const handleDelete = () => {
        setIsDeleted(true);
        onDelete();
      };
      
      if (isDeleted) {
        return onNotFound();
      }
      
      return (
        <div data-testid="markdown-viewer">
          <div>Viewing: {filePath}</div>
          <button onClick={onEdit}>Edit</button>
          <button onClick={handleDelete}>Delete</button>
        </div>
      );
    }
  };
});

jest.mock('../components/MarkdownEditor', () => ({
  MarkdownEditor: ({ filePath, onSave, onCancel }: {
    filePath: string;
    onSave: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="markdown-editor">
      <div>Editing: {filePath}</div>
      <button onClick={onSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

jest.mock('../components/CreatePage', () => ({
  CreatePage: ({ path, onCreateClick }: {
    path: string;
    onCreateClick: () => void;
  }) => (
    <div data-testid="create-page">
      <div>Create page for: {path}</div>
      <button onClick={onCreateClick}>Create</button>
    </div>
  )
}));

// Mock the PageBrowser component to simulate navigation
jest.mock('../components/PageBrowser', () => {
  const { useNavigate } = require('react-router-dom');
  
  return {
    PageBrowser: () => {
      const navigate = useNavigate();
      
      return (
        <div data-testid="page-browser">
          <button onClick={() => navigate('/page/docs/page1')}>Page 1</button>
          <button onClick={() => navigate('/page/docs/page2')}>Page 2</button>
          <button onClick={() => navigate('/page/page3')}>Page 3</button>
        </div>
      );
    }
  };
});

// Mock other components that aren't relevant to these tests
jest.mock('../components/NavigationBlocker', () => ({
  NavigationBlocker: () => <div data-testid="navigation-blocker" />
}));

jest.mock('../components/UnsavedChangesDialog', () => ({
  UnsavedChangesDialog: () => <div data-testid="unsaved-changes-dialog" />
}));

// Helper function to setup the test environment
const renderWithRouter = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </MemoryRouter>
  );
};

describe('Page Deletion Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default API responses
    (api.load as jest.Mock).mockImplementation((path) => {
      if (path === 'docs/page1.md') {
        return Promise.resolve('# Page 1');
      } else if (path === 'docs/page2.md') {
        return Promise.resolve('# Page 2');
      } else if (path === 'page3.md') {
        return Promise.resolve('# Page 3');
      }
      return Promise.reject(new Error('404'));
    });
  });

  test('deleting a page shows create page interface', async () => {
    renderWithRouter(['/page/docs/page1']);
    
    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
    });
    
    // Delete the page
    fireEvent.click(screen.getByText('Delete'));
    
    // Should show the create page interface
    await waitFor(() => {
      expect(screen.getByTestId('create-page')).toBeInTheDocument();
      expect(screen.getByText('Create page for: docs/page1')).toBeInTheDocument();
    });
  });

  test('navigating to another page after deletion shows that page correctly', async () => {
    renderWithRouter(['/page/docs/page1']);
    
    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
    });
    
    // Delete the page
    fireEvent.click(screen.getByText('Delete'));
    
    // Should show the create page interface
    await waitFor(() => {
      expect(screen.getByTestId('create-page')).toBeInTheDocument();
    });
    
    // Navigate to another page
    fireEvent.click(screen.getByText('Page 2'));
    
    // Should show the markdown viewer for the new page
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
      expect(screen.getByText('Viewing: docs/page2.md')).toBeInTheDocument();
    });
  });

  test('deleting multiple pages in sequence works correctly', async () => {
    renderWithRouter(['/page/docs/page1']);
    
    // Wait for the first page to load
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
      expect(screen.getByText('Viewing: docs/page1.md')).toBeInTheDocument();
    });
    
    // Delete the first page
    fireEvent.click(screen.getByText('Delete'));
    
    // Should show the create page interface
    await waitFor(() => {
      expect(screen.getByTestId('create-page')).toBeInTheDocument();
    });
    
    // Navigate to another page
    fireEvent.click(screen.getByText('Page 2'));
    
    // Should show the markdown viewer for the second page
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
      expect(screen.getByText('Viewing: docs/page2.md')).toBeInTheDocument();
    });
    
    // Delete the second page
    fireEvent.click(screen.getByText('Delete'));
    
    // Should show the create page interface
    await waitFor(() => {
      expect(screen.getByTestId('create-page')).toBeInTheDocument();
    });
    
    // Navigate to the third page
    fireEvent.click(screen.getByText('Page 3'));
    
    // Should show the markdown viewer for the third page
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
      expect(screen.getByText('Viewing: page3.md')).toBeInTheDocument();
    });
  });

  test('creating a page after deletion works correctly', async () => {
    renderWithRouter(['/page/docs/page1']);
    
    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
    });
    
    // Delete the page
    fireEvent.click(screen.getByText('Delete'));
    
    // Should show the create page interface
    await waitFor(() => {
      expect(screen.getByTestId('create-page')).toBeInTheDocument();
    });
    
    // Click create button
    fireEvent.click(screen.getByText('Create'));
    
    // Should navigate to edit mode
    await waitFor(() => {
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
      expect(screen.getByText('Editing: docs/page1.md')).toBeInTheDocument();
    });
  });
});
