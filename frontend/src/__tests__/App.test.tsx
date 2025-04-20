import { render, act } from '@testing-library/react';
import App from '../App';

// Mock the API to prevent actual API calls
jest.mock('../api/client', () => ({
  api: {
    getFiles: jest.fn().mockResolvedValue([]),
    load: jest.fn().mockResolvedValue(''),
    save: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    render: jest.fn().mockResolvedValue(''),
    getConfig: jest.fn().mockResolvedValue({ wikiPath: '/test/wiki/path' }),
    setConfig: jest.fn().mockResolvedValue({}),
    init: jest.fn().mockResolvedValue({}),
    pull: jest.fn().mockResolvedValue({}),
    push: jest.fn().mockResolvedValue({}),
    fetch: jest.fn().mockResolvedValue({}),
    getStatus: jest.fn().mockResolvedValue({
      branch: 'main',
      ahead: 0,
      behind: 0,
      modified: 0,
      untracked: 0
    })
  }
}));

// Mock the gitApi
jest.mock('../api/gitApi', () => ({
  gitApi: {
    getStatus: jest.fn().mockResolvedValue({
      hasRemote: true,
      branchName: 'main',
      aheadCount: 0,
      behindCount: 0,
      modifiedCount: 0,
      untrackedCount: 0,
      lastFetched: Date.now()
    }),
    pull: jest.fn().mockResolvedValue({}),
    push: jest.fn().mockResolvedValue({}),
    fetch: jest.fn().mockResolvedValue({}),
    shouldFetch: jest.fn().mockReturnValue(false)
  }
}));

// Mock the router
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: () => <div>Route</div>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({ '*': '' }),
}));

// Mock the NavigationProvider
jest.mock('../contexts/NavigationContext', () => ({
  NavigationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useNavigation: () => ({
    setBlockNavigation: jest.fn(),
    setHasUnsavedChanges: jest.fn(),
    blockNavigation: false,
    hasUnsavedChanges: false,
    pendingLocation: null,
    setPendingLocation: jest.fn(),
    confirmNavigation: jest.fn(),
    cancelNavigation: jest.fn(),
    setNavigationCallback: jest.fn()
  })
}));

// Mock the ThemeProvider
jest.mock('../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: () => ({
    mode: 'light',
    toggleTheme: jest.fn()
  })
}));

// Mock PageBrowser to prevent state updates
jest.mock('../components/PageBrowser', () => ({
  PageBrowser: () => <div data-testid="page-browser">Page Browser</div>
}));

// Mock GitStatusBar
jest.mock('../components/GitStatusBar', () => ({
  GitStatusBar: () => <div data-testid="git-status-bar">Git Status</div>
}));

// Mock NewPageDialog
jest.mock('../components/NewPageDialog', () => ({
  NewPageDialog: () => <div data-testid="new-page-dialog">New Page Dialog</div>
}));

// Mock lazy-loaded components
jest.mock('../components/MarkdownViewer', () => ({
  MarkdownViewer: () => <div>Markdown Viewer</div>
}));

jest.mock('../components/MarkdownEditor', () => ({
  MarkdownEditor: () => <div>Markdown Editor</div>
}));

jest.mock('../components/CreatePage', () => ({
  CreatePage: () => <div>Create Page</div>
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn().mockReturnValue('5 minutes')
}));

test('renders without crashing', async () => {
  await act(async () => {
    render(<App />);
  });
});

test('renders with fixed sidebar', async () => {
  await act(async () => {
    render(<App />);
  });
});
