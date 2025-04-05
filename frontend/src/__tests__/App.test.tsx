import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { NavigationProvider } from '../contexts/NavigationContext';

// Mock the components that use react-markdown to avoid test issues
jest.mock('../components/MarkdownViewer', () => ({
  MarkdownViewer: () => <div data-testid="markdown-viewer">Markdown Viewer</div>
}));

test('renders page browser', () => {
  render(
    <NavigationProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </NavigationProvider>
  );
  expect(screen.getByText('Loading files...')).toBeInTheDocument();
});
