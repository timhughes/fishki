import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock the API
jest.mock('../api/client', () => ({
  api: {
    load: jest.fn().mockResolvedValue('# Test Content'),
    getFiles: jest.fn().mockResolvedValue([
      { path: 'folder/', type: 'directory', name: 'folder' },
      { path: 'folder/page.md', type: 'file', name: 'page.md' }
    ]),
    getConfig: jest.fn().mockResolvedValue({ wikiPath: '/test/wiki/path' })
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

// Mock the SetupWizard component
jest.mock('../components/SetupWizard', () => ({
  SetupWizard: () => <div data-testid="setup-wizard">Setup Wizard</div>
}));

// Mock the ViewPage component
const ViewPage = () => {
  return (
    <div>
      <div data-testid="view-page">View Page</div>
    </div>
  );
};

describe('Directory Path Handling', () => {
  test('handles directory paths correctly', () => {
    render(
      <MemoryRouter initialEntries={['/folder/']}>
        <Routes>
          <Route path="/:path/*" element={<ViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('view-page')).toBeInTheDocument();
  });
});
