// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({
  // Increase the timeout for async operations
  asyncUtilTimeout: 5000,
});

// Mock TextEncoder and TextDecoder which are required by React Router v7
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Add missing type declarations for jest-dom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveValue(value: any): R;
    }
  }
}

// Silence React act() warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (/Warning.*not wrapped in act/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock the ReactMarkdown component for tests
jest.mock('react-markdown', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children: string }) => {
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
