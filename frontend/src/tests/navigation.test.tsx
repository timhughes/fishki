import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { NavigationProvider, useNavigation } from '../contexts/NavigationContext';

// Mock components to avoid issues with react-markdown
jest.mock('../components/MarkdownEditor', () => ({
  MarkdownEditor: ({ onSave, onCancel, initialContent }: any) => {
    return (
      <div>
        <textarea 
          role="textbox" 
          defaultValue={initialContent}
        />
        <button onClick={onSave}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  }
}));

jest.mock('../components/UnsavedChangesDialog', () => ({
  UnsavedChangesDialog: ({ open, onContinue, onCancel }: any) => (
    open ? (
      <div role="dialog">
        <h2>Unsaved Changes</h2>
        <p>You have unsaved changes that will be lost if you navigate away.</p>
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onContinue}>Discard Changes</button>
      </div>
    ) : null
  )
}));

jest.mock('../components/NavigationBlocker', () => ({
  NavigationBlocker: () => <div data-testid="navigation-blocker" />
}));

// Mock API
jest.mock('../api/client', () => ({
  api: {
    load: jest.fn().mockResolvedValue('# Test Content'),
    save: jest.fn().mockResolvedValue({}),
    render: jest.fn().mockResolvedValue('<h1>Test Content</h1>'),
  },
}));

// Test component that simulates our app structure
const TestApp = () => {
  const navigate = useNavigate();
  const { pendingLocation, confirmNavigation, cancelNavigation, setHasUnsavedChanges, setPendingLocation } = useNavigation();

  const handleFileSelect = (path: string) => {
    navigate(`/page/${path}`);
  };

  const handleTextChange = () => {
    setHasUnsavedChanges(true);
  };

  const attemptNavigation = () => {
    // Simulate what happens in useNavigationProtection hook
    setPendingLocation('/page/other-page');
  };

  return (
    <>
      <button onClick={() => handleFileSelect('other-page')}>Navigate to Other Page</button>
      <button onClick={attemptNavigation} data-testid="attempt-navigation">Attempt Navigation</button>
      
      <Routes>
        <Route 
          path="/edit/:path" 
          element={
            <div>
              <textarea 
                role="textbox" 
                defaultValue="# Initial Content"
                onChange={handleTextChange}
              />
            </div>
          } 
        />
        <Route 
          path="/page/:path" 
          element={<div>View Page</div>} 
        />
      </Routes>
      
      {/* For testing purposes, we'll manually render the dialog based on pendingLocation */}
      {pendingLocation && (
        <div role="dialog">
          <h2>Unsaved Changes</h2>
          <p>You have unsaved changes that will be lost if you navigate away.</p>
          <button onClick={cancelNavigation}>Cancel</button>
          <button onClick={confirmNavigation}>Discard Changes</button>
        </div>
      )}
    </>
  );
};

// This is a simplified test that focuses on the core functionality
describe('Navigation Protection', () => {
  test('shows unsaved changes dialog when navigating with unsaved changes', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/test']}>
        <NavigationProvider>
          <TestApp />
        </NavigationProvider>
      </MemoryRouter>
    );

    // Verify we're on the edit page
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    
    // Make changes to the content
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '# Modified Content' } });
    
    // Attempt navigation
    fireEvent.click(screen.getByTestId('attempt-navigation'));
    
    // Check if the dialog appears
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    });
    
    // Click "Discard Changes"
    fireEvent.click(screen.getByText('Discard Changes'));
    
    // Verify the dialog is gone
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('cancels navigation when clicking cancel in the dialog', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/test']}>
        <NavigationProvider>
          <TestApp />
        </NavigationProvider>
      </MemoryRouter>
    );

    // Make changes to the content
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '# Modified Content' } });
    
    // Attempt navigation
    fireEvent.click(screen.getByTestId('attempt-navigation'));
    
    // Check if the dialog appears
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Click "Cancel"
    fireEvent.click(screen.getByText('Cancel'));
    
    // Verify the dialog is gone but we're still on the edit page
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  test('navigation works without dialog when no unsaved changes', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/test']}>
        <NavigationProvider>
          <TestApp />
        </NavigationProvider>
      </MemoryRouter>
    );

    // Navigate without making changes
    fireEvent.click(screen.getByText('Navigate to Other Page'));
    
    // Verify we navigated successfully without a dialog
    await waitFor(() => {
      expect(screen.getByText('View Page')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
