import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
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

// Mock react-markdown to return a simple div with the content
jest.mock('react-markdown', () => {
  function MockMarkdown(props: { children: string }) {
    return `<div data-testid="markdown">${props.children}</div>`;
  }
  MockMarkdown.displayName = 'ReactMarkdown';
  return MockMarkdown;
});

// Mock react-syntax-highlighter
jest.mock('react-syntax-highlighter', () => ({
  Prism: function MockPrism(props: { children: string }) {
    return `<pre>${props.children}</pre>`;
  }
}));

// Mock syntax highlighter styles
jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  materialDark: {},
  materialLight: {},
}));
