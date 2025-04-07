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
    init: jest.fn().mockResolvedValue({})
  }
}));

// Mock the router
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: () => <div>Route</div>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
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

// Mock PageBrowser to prevent state updates
jest.mock('../components/PageBrowser', () => ({
  PageBrowser: () => <div data-testid="page-browser">Page Browser</div>
}));

test('renders without crashing', async () => {
  await act(async () => {
    render(<App />);
  });
});
