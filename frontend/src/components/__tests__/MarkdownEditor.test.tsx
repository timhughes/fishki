import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownEditor } from '../MarkdownEditor';
import { NavigationProvider } from '../../contexts/NavigationContext';
import '@testing-library/jest-dom';

// Mock the API client
jest.mock('../../api/client', () => ({
  api: {
    save: jest.fn().mockResolvedValue({}),
  },
}));

// Import the mocked API client
import { api } from '../../api/client';

describe('MarkdownEditor', () => {
  const mockInitialContent = '# Test Content';
  const mockFilePath = 'test.md';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial content and preview', async () => {
    render(
      <NavigationProvider>
        <MarkdownEditor
          filePath={mockFilePath}
          initialContent={mockInitialContent}
          onSave={() => {}}
          onCancel={() => {}}
        />
      </NavigationProvider>
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toHaveValue(mockInitialContent);

    // Check that the preview shows the initial content
    const previewContent = screen.getByTestId('markdown-content');
    expect(previewContent).toHaveTextContent(mockInitialContent);
  });

  it('handles save and cancel buttons', async () => {
    const handleSave = jest.fn();
    const handleCancel = jest.fn();
    
    render(
      <NavigationProvider>
        <MarkdownEditor
          filePath={mockFilePath}
          initialContent={mockInitialContent}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </NavigationProvider>
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    // Click save button and wait for the save operation to complete
    await userEvent.click(saveButton);
    
    await waitFor(() => {
      expect(api.save).toHaveBeenCalledWith(mockFilePath, mockInitialContent);
      expect(handleSave).toHaveBeenCalled();
    });
    
    // Reset the mock for the next test
    jest.mocked(api.save).mockClear();
    handleSave.mockClear();
    
    // Click cancel button
    await userEvent.click(cancelButton);
    expect(handleCancel).toHaveBeenCalled();
  });

  it('updates preview when content changes', async () => {
    const newContent = '## Updated Content';

    render(
      <NavigationProvider>
        <MarkdownEditor
          filePath={mockFilePath}
          initialContent={mockInitialContent}
          onSave={() => {}}
          onCancel={() => {}}
        />
      </NavigationProvider>
    );

    // Check initial preview content
    const initialPreviewContent = screen.getByTestId('markdown-content');
    expect(initialPreviewContent).toHaveTextContent(mockInitialContent);

    // Update content
    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, newContent);

    // Check that the preview updates with the new content
    await waitFor(() => {
      const updatedPreviewContent = screen.getByTestId('markdown-content');
      expect(updatedPreviewContent).toHaveTextContent(newContent);
    });
  });

  it('handles saving states and errors', async () => {
    const error = 'Failed to save content';
    jest.mocked(api.save).mockRejectedValueOnce(new Error(error));

    render(
      <NavigationProvider>
        <MarkdownEditor
          filePath={mockFilePath}
          initialContent={mockInitialContent}
          onSave={() => {}}
          onCancel={() => {}}
        />
      </NavigationProvider>
    );

    // Click the save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    // Wait for the error message to appear
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(error);
  });

  it('shows unsaved changes alert when content is modified', async () => {
    render(
      <NavigationProvider>
        <MarkdownEditor
          filePath={mockFilePath}
          initialContent={mockInitialContent}
          onSave={() => {}}
          onCancel={() => {}}
        />
      </NavigationProvider>
    );

    // Initially, no alert should be shown
    expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();

    // Modify content
    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Modified content');

    // Alert should now be shown
    await waitFor(() => {
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });
  });
});
