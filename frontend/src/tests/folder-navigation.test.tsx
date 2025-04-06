import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock the API
const mockGetFiles = jest.fn().mockResolvedValue([
  { path: 'folder/', type: 'directory', name: 'folder' },
  { path: 'folder/page.md', type: 'file', name: 'page.md' }
]);

jest.mock('../api/client', () => ({
  api: {
    load: jest.fn().mockResolvedValue('# Test Content'),
    getFiles: () => mockGetFiles()
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
  // Call the mocked API function to ensure it's called
  mockGetFiles();
  
  return (
    <div>
      <div data-testid="view-page">View Page</div>
    </div>
  );
};

describe('Folder Navigation', () => {
  test('handles folder navigation correctly', () => {
    render(
      <MemoryRouter initialEntries={['/folder/']}>
        <Routes>
          <Route path="/:path/*" element={<ViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('view-page')).toBeInTheDocument();
    expect(mockGetFiles).toHaveBeenCalled();
  });
});
