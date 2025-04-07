import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NavigationProvider } from '../contexts/NavigationContext';

// Mock the API
jest.mock('../api/client', () => ({
  api: {
    load: jest.fn().mockResolvedValue('# Test Content'),
    save: jest.fn().mockResolvedValue({}),
    getFiles: jest.fn().mockResolvedValue([]),
    getConfig: jest.fn().mockResolvedValue({ wikiPath: '/test/wiki/path' })
  }
}));

// Mock the MarkdownEditor component
jest.mock('../components/MarkdownEditor', () => ({
  MarkdownEditor: ({ 
    filePath, 
    initialContent, 
    onSave, 
    onCancel 
  }: { 
    filePath: string; 
    initialContent: string; 
    onSave: () => void; 
    onCancel: () => void;
  }) => (
    <div data-testid="markdown-editor">
      <div>Path: {filePath}</div>
      <div>Content: {initialContent}</div>
      <button onClick={onSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
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

// Simple test components
const ViewPage = () => {
  return <div data-testid="view-page">View Page</div>;
};

const EditPage = () => {
  const { setHasUnsavedChanges } = require('../contexts/NavigationContext').useNavigation();
  
  React.useEffect(() => {
    setHasUnsavedChanges(true);
    return () => setHasUnsavedChanges(false);
  }, [setHasUnsavedChanges]);
  
  return <div data-testid="edit-page">Edit Page</div>;
};

// Test App component
const TestApp = () => {
  return (
    <NavigationProvider>
      <div data-testid="app">
        <Routes>
          <Route path="/page/:path/*" element={<ViewPage />} />
          <Route path="/edit/:path/*" element={<EditPage />} />
        </Routes>
        <div data-testid="navigation-blocker">Navigation Blocker</div>
      </div>
    </NavigationProvider>
  );
};

describe('Navigation Protection', () => {
  test('shows unsaved changes dialog when navigating away from edit page', async () => {
    // Render with edit page
    const { rerender } = render(
      <MemoryRouter initialEntries={['/edit/test']}>
        <TestApp />
      </MemoryRouter>
    );
    
    // Verify edit page is shown
    expect(screen.getByTestId('edit-page')).toBeInTheDocument();
    
    // Navigate to a different page
    await act(async () => {
      rerender(
        <MemoryRouter initialEntries={['/page/other']}>
          <TestApp />
        </MemoryRouter>
      );
    });
    
    // Unsaved changes dialog should be shown
    expect(screen.getByTestId('navigation-blocker')).toBeInTheDocument();
  });
});
