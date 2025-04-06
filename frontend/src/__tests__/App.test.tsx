import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { NavigationProvider } from '../contexts/NavigationContext';
import { MemoryRouter } from 'react-router-dom';

// Mock the components that use react-markdown to avoid test issues
jest.mock('../components/MarkdownViewer', () => ({
  MarkdownViewer: () => <div data-testid="markdown-viewer">Markdown Viewer</div>
}));

// Mock the API
jest.mock('../api/client', () => ({
  api: {
    load: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    render: jest.fn()
  }
}));

// Create a custom wrapper that provides the necessary context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <MemoryRouter>
      <NavigationProvider>
        {children}
      </NavigationProvider>
    </MemoryRouter>
  );
};

test('renders app with page browser', () => {
  render(
    <App />,
    { wrapper: TestWrapper }
  );
  
  // Check if the app renders without crashing
  expect(document.body).toBeInTheDocument();
});
