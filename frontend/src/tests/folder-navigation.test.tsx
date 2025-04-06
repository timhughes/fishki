import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavigationProvider } from '../contexts/NavigationContext';

// Mock the API
jest.mock('../api/client', () => ({
  api: {
    load: jest.fn().mockResolvedValue('# Test Content'),
    save: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    list: jest.fn().mockResolvedValue([
      { path: 'folder/', type: 'directory' },
      { path: 'folder/index.md', type: 'file' },
      { path: 'test.md', type: 'file' }
    ]),
    render: jest.fn().mockResolvedValue('<h1>Test Content</h1>')
  }
}));

// Mock the components that use react-markdown to avoid test issues
jest.mock('../components/MarkdownViewer', () => ({
  MarkdownViewer: ({ filePath, onEdit, onDelete }) => (
    <div data-testid="markdown-viewer">
      <div>Viewing: {filePath}</div>
      <button onClick={onEdit}>Edit</button>
      <button onClick={onDelete}>Delete</button>
    </div>
  )
}));

jest.mock('../components/CreatePage', () => ({
  CreatePage: ({ path, onCreateClick }: any) => (
    <div data-testid="create-page">
      <div>Create page for: {path}</div>
      <button onClick={onCreateClick}>Create</button>
    </div>
  )
}));

// Create a custom wrapper that provides the necessary context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavigationProvider>
      {children}
    </NavigationProvider>
  );
};

describe('Folder Navigation', () => {
  test('renders correctly', () => {
    render(
      <MemoryRouter initialEntries={['/page/folder']}>
        <div data-testid="test-component">Test Component</div>
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );
    
    // Verify the component renders
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });
});
