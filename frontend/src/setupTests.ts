// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

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
