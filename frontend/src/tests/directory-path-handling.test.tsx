import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavigationProvider } from '../contexts/NavigationContext';
import App from '../App';
import { api } from '../api/client';

// Mock the API client
jest.mock('../api/client', () => {
  return {
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
              name: 'index.md',
              type: 'file',
              path: 'docs/index.md'
            }
          ]
        },
        {
          name: 'projects',
          type: 'folder',
          path: 'projects',
          children: []
        }
      ]),
      render: jest.fn().mockResolvedValue('<h1>Test Content</h1>'),
    }
  };
});

// Mock components to simplify testing
jest.mock('../components/MarkdownViewer', () => ({
  MarkdownViewer: ({ filePath, onEdit, onDelete, onNotFound }: {
    filePath: string;
    onEdit: () => void;
    onDelete: () => void;
    onNotFound: () => React.ReactNode;
  }) => {
    // If the path is for a non-existent file, show the not found component
    if (filePath === 'projects/index.md') {
      return onNotFound();
    }
    
    return (
      <div data-testid="markdown-viewer">
        <div>Viewing: {filePath}</div>
        <button onClick={onEdit}>Edit</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    );
  }
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

// Mock the PageBrowser component to simulate folder navigation
jest.mock('../components/PageBrowser', () => {
  const { useNavigate } = require('react-router-dom');
  
  return {
    PageBrowser: () => {
      const navigate = useNavigate();
      
      return (
        <div data-testid="page-browser">
          <button onClick={() => navigate('/page/docs/')}>docs folder</button>
          <button onClick={() => navigate('/page/projects/')}>projects folder</button>
          <button onClick={() => navigate('/page/docs/index')}>docs index</button>
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

describe('Directory Path Handling Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default API responses
    (api.load as jest.Mock).mockImplementation((path) => {
      if (path === 'docs/index.md') {
        return Promise.resolve('# Docs Index');
      } else if (path === 'projects/index.md') {
        return Promise.reject(new Error('404'));
      } else if (path.endsWith('/')) {
        return Promise.reject(new Error('Cannot load a directory directly'));
      }
      return Promise.resolve('# Content');
    });
  });

  test('API client rejects requests for directory paths', async () => {
    // We'll test this indirectly by checking that the app navigates correctly
    // when a folder path is requested
    renderWithRouter();
    
    // Click on the docs folder
    fireEvent.click(screen.getByText('docs folder'));
    
    // Should navigate to the index page without trying to load the folder directly
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
      expect(screen.getByText('Viewing: docs/index.md')).toBeInTheDocument();
    });
  });

  test('clicking on a folder with index navigates to the index page', async () => {
    renderWithRouter();
    
    // Click on the docs folder which has an index
    fireEvent.click(screen.getByText('docs folder'));
    
    // Should navigate to the index page
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
      expect(screen.getByText('Viewing: docs/index.md')).toBeInTheDocument();
    });
  });

  test('clicking on a folder without index shows create page interface', async () => {
    renderWithRouter();
    
    // Click on the projects folder which doesn't have an index
    fireEvent.click(screen.getByText('projects folder'));
    
    // Should show the create page interface
    await waitFor(() => {
      expect(screen.getByTestId('create-page')).toBeInTheDocument();
      expect(screen.getByText('Create page for: projects/index')).toBeInTheDocument();
    });
  });

  test('navigating directly to a folder path redirects to index', async () => {
    renderWithRouter(['/page/docs/']);
    
    // Should redirect to the index page
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
      expect(screen.getByText('Viewing: docs/index.md')).toBeInTheDocument();
    });
  });

  test('navigating directly to a folder without index shows create page', async () => {
    renderWithRouter(['/page/projects/']);
    
    // Should show the create page interface
    await waitFor(() => {
      expect(screen.getByTestId('create-page')).toBeInTheDocument();
      expect(screen.getByText('Create page for: projects/index')).toBeInTheDocument();
    });
  });

  test('navigating directly to an index page works correctly', async () => {
    renderWithRouter(['/page/docs/index']);
    
    // Should show the markdown viewer with the index page
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
      expect(screen.getByText('Viewing: docs/index.md')).toBeInTheDocument();
    });
  });
});
