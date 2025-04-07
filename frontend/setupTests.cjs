// jest-dom adds custom jest matchers for asserting on DOM nodes.
require('@testing-library/jest-dom');

// Mock TextEncoder and TextDecoder which are required by React Router v7
const util = require('util');
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;

// Mock the ReactMarkdown component for tests
jest.mock('react-markdown', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }) => {
      return React.createElement('div', { 'data-testid': 'markdown-content' }, children);
    }
  };
});

// Mock the plugins
jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('rehype-raw', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('rehype-sanitize', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('rehype-highlight', () => ({
  __esModule: true,
  default: () => null
}));

// Mock React Router components
jest.mock('react-router-dom', () => {
  // Use require instead of import for compatibility
  const originalModule = jest.requireActual('react-router-dom');
  
  return {
    __esModule: true,
    ...originalModule,
    // Mock the useBlocker hook to avoid issues in tests
    useBlocker: jest.fn((shouldBlock) => ({
      state: shouldBlock ? 'blocked' : 'unblocked',
      location: { pathname: '/test', search: '' },
      proceed: jest.fn(),
      reset: jest.fn()
    })),
    // Ensure other hooks work as expected
    useNavigate: () => jest.fn(),
    useParams: () => ({ '*': 'test' }),
    useLocation: () => ({ pathname: '/test', search: '' }),
  };
});
