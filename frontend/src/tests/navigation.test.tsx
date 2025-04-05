import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { NavigationProvider, useNavigation } from '../contexts/NavigationContext';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { UnsavedChangesDialog } from '../components/UnsavedChangesDialog';
import { NavigationBlocker } from '../components/NavigationBlocker';

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
  const { pendingLocation, confirmNavigation, cancelNavigation } = useNavigation();

  const handleFileSelect = (path: string) => {
    navigate(`/page/${path}`);
  };

  return (
    <>
      <button onClick={() => handleFileSelect('other-page')}>Navigate to Other Page</button>
      
      <Routes>
        <Route 
          path="/edit/:path" 
          element={
            <MarkdownEditor 
              filePath="test.md"
              initialContent="# Initial Content"
              onSave={() => {
                navigate('/page/test');
              }}
              onCancel={() => navigate('/page/test')}
            />
          } 
        />
        <Route 
          path="/page/:path" 
          element={<div>View Page</div>} 
        />
      </Routes>
      
      <NavigationBlocker />
      <UnsavedChangesDialog
        open={!!pendingLocation}
        onContinue={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </>
  );
};

describe('Navigation Protection', () => {
  test('shows unsaved changes dialog when navigating away from edited content', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/test']}>
        <NavigationProvider>
          <TestApp />
        </NavigationProvider>
      </MemoryRouter>
    );

    // Wait for editor to load
    await waitFor(() => screen.getByRole('textbox'));
    
    // Make changes to the content
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '# Modified Content' } });
    
    // Try to navigate away
    fireEvent.click(screen.getByText('Navigate to Other Page'));
    
    // Check if the dialog appears
    await waitFor(() => {
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    });
    
    // Click "Discard Changes"
    fireEvent.click(screen.getByText('Discard Changes'));
    
    // Verify we navigated away
    await waitFor(() => {
      expect(screen.getByText('View Page')).toBeInTheDocument();
    });
  });

  test('stays on edit page when canceling navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/test']}>
        <NavigationProvider>
          <TestApp />
        </NavigationProvider>
      </MemoryRouter>
    );

    // Wait for editor to load
    await waitFor(() => screen.getByRole('textbox'));
    
    // Make changes to the content
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '# Modified Content' } });
    
    // Try to navigate away
    fireEvent.click(screen.getByText('Navigate to Other Page'));
    
    // Check if the dialog appears
    await waitFor(() => {
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    });
    
    // Click "Cancel"
    fireEvent.click(screen.getByText('Cancel'));
    
    // Verify we're still on the edit page
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('# Modified Content');
    });
  });
});
