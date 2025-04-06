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
            name: 'index.md',
            type: 'file',
            path: 'docs/index.md'
          },
          {
            name: 'getting-started.md',
            type: 'file',
            path: 'docs/getting-started.md'
          }
        ]
      },
      {
        name: 'projects',
        type: 'folder',
        path: 'projects',
        children: []
      },
      {
        name: 'index.md',
        type: 'file',
        path: 'index.md'
      }
    ]),
    render: jest.fn().mockResolvedValue('<h1>Test Content</h1>'),
  },
}));

// Mock components to simplify testing
jest.mock('../components/MarkdownViewer', () => ({
  MarkdownViewer: ({ filePath, onEdit, onDelete, onNotFound }) => {
    // Mock the behavior of MarkdownViewer
    if (filePath === 'projects/index.md') {
      // Simulate not found for projects/index.md
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

jest.mock('../components/MarkdownEditor', () => ({
  MarkdownEditor: ({ filePath, onSave, onCancel }) => (
    <div data-testid="markdown-editor">
      <div>Editing: {filePath}</div>
      <button onClick={onSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

jest.mock('../components/CreatePage', () => ({
  CreatePage: ({ path, onCreateClick }) => (
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
          <button onClick={() => navigate('/page/docs/')}>docs (with index)</button>
          <button onClick={() => navigate('/page/projects/')}>projects (no index)</button>
          <button onClick={() => navigate('/page/index')}>root index</button>
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

describe('Folder Navigation Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default API responses
    (api.load as jest.Mock).mockImplementation((path) => {
      if (path === 'docs/index.md') {
        return Promise.resolve('# Docs Index');
      } else if (path === 'index.md') {
        return Promise.resolve('# Root Index');
      } else if (path === 'projects/index.md') {
        return Promise.reject(new Error('404'));
      }
      return Promise.resolve('# Content');
    });
  });

  test('clicking on a folder with index shows the index page', async () => {
    renderWithRouter();
    
    // Click on the docs folder which has an index
    fireEvent.click(screen.getByText('docs (with index)'));
    
    // Should show the markdown viewer with the index page
    await waitFor(() => {
      expect(api.load).toHaveBeenCalledWith('docs/index.md');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
    });
  });

  test('clicking on a folder without index shows create page interface', async () => {
    // Mock the API to reject with 404 for projects/index.md
    (api.load as jest.Mock).mockImplementation((path) => {
      if (path === 'projects/index.md') {
        return Promise.reject(new Error('404'));
      }
      return Promise.resolve('# Content');
    });
    
    renderWithRouter();
    
    // Click on the projects folder which doesn't have an index
    fireEvent.click(screen.getByText('projects (no index)'));
    
    // Should show the create page interface
    await waitFor(() => {
      expect(api.load).toHaveBeenCalledWith('projects/index.md');
    });
    
    // Wait for the create page to appear
    await waitFor(() => {
      const createPageElement = screen.getByTestId('create-page');
      expect(createPageElement).toBeInTheDocument();
    });
  });

  test('navigating to a URL with trailing slash shows index or create page', async () => {
    // Simulate navigating to a URL with trailing slash
    renderWithRouter(['/page/docs/']);
    
    // Should redirect to the index page
    await waitFor(() => {
      expect(api.load).toHaveBeenCalledWith('docs/index.md');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
    });
  });

  test('navigating to a folder without index shows create page', async () => {
    // Mock the API to reject with 404 for projects/index.md
    (api.load as jest.Mock).mockImplementation((path) => {
      if (path === 'projects/index.md') {
        return Promise.reject(new Error('404'));
      }
      return Promise.resolve('# Content');
    });
    
    // Render with projects folder path
    renderWithRouter(['/page/projects/']);
    
    // Should try to load the index page
    await waitFor(() => {
      expect(api.load).toHaveBeenCalledWith('projects/index.md');
    });
    
    // Should show the create page interface
    await waitFor(() => {
      const createPageElement = screen.getByTestId('create-page');
      expect(createPageElement).toBeInTheDocument();
    });
  });

  test('clicking create on a non-existent index page navigates to edit mode', async () => {
    // Mock the API to reject with 404 for projects/index.md
    (api.load as jest.Mock).mockImplementation((path) => {
      if (path === 'projects/index.md') {
        return Promise.reject(new Error('404'));
      }
      return Promise.resolve('# Content');
    });
    
    renderWithRouter(['/page/projects/']);
    
    // Wait for the create page interface to appear
    await waitFor(() => {
      expect(screen.getByTestId('create-page')).toBeInTheDocument();
    });
    
    // Click the create button
    fireEvent.click(screen.getByText('Create'));
    
    // Should navigate to edit mode
    await waitFor(() => {
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
    });
  });

  test('root path shows index page if it exists', async () => {
    renderWithRouter(['/']);
    
    // Should show the root index page
    await waitFor(() => {
      expect(api.load).toHaveBeenCalledWith('index.md');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
    });
  });
});
