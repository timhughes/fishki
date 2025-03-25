import React from 'react';
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

interface MarkdownProps {
  children: string;
  components?: Record<string, unknown>;
}

interface SyntaxHighlighterProps {
  children: string;
}

// Transform ESM modules
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children, components }: MarkdownProps): JSX.Element | null => {
    if (typeof children === 'string') {
      return React.createElement('div', { 'data-testid': 'markdown' }, children);
    }
    return null;
  },
}));

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: SyntaxHighlighterProps): JSX.Element => 
    React.createElement('pre', null, children),
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  materialDark: {},
  materialLight: {},
}));
