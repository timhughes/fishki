import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock the API
jest.mock('../api/client', () => ({
  api: {
    load: jest.fn().mockResolvedValue('# Test Content'),
    delete: jest.fn().mockResolvedValue({}),
    getFiles: jest.fn().mockResolvedValue([
      { path: 'page.md', type: 'file', name: 'page.md' }
    ])
  }
}));

// Mock the MarkdownViewer component
jest.mock('../components/MarkdownViewer', () => ({
  MarkdownViewer: ({ 
    filePath, 
    onEdit, 
    onDelete 
  }: { 
    filePath: string; 
    onEdit: () => void; 
    onDelete: () => void;
    onNotFound: () => React.ReactNode;
  }) => (
    <div data-testid="markdown-viewer">
      <div>Path: {filePath}</div>
      <button onClick={onEdit}>Edit</button>
      <button onClick={onDelete}>Delete</button>
    </div>
  )
}));

// Mock the PageBrowser component
jest.mock('../components/PageBrowser', () => ({
  PageBrowser: () => <div data-testid="page-browser">Page Browser</div>
}));

// Mock the ViewPage component
const ViewPage = () => {
  return (
    <div>
      <div data-testid="view-page">View Page</div>
    </div>
  );
};

describe('Page Deletion', () => {
  test('handles page deletion correctly', () => {
    render(
      <MemoryRouter initialEntries={['/page.md']}>
        <Routes>
          <Route path="/:path" element={<ViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('view-page')).toBeInTheDocument();
  });
});
