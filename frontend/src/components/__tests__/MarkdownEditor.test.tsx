import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownEditor } from '../MarkdownEditor';
import { api } from '../../api/client';
import { NavigationProvider } from '../../contexts/NavigationContext';

jest.mock('../../api/client', () => ({
  api: {
    save: jest.fn(),
    render: jest.fn(),
  },
}));

describe('MarkdownEditor', () => {
  const mockInitialContent = '# Test Content';
  const mockRenderedContent = '<h1>Test Content</h1>';
  const mockFilePath = 'test.md';

  beforeEach(() => {
    (api.save as jest.Mock).mockResolvedValue(undefined);
    (api.render as jest.Mock).mockResolvedValue(mockRenderedContent);
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
    expect(textarea.value).toBe(mockInitialContent);

    await waitFor(() => {
      const preview = screen.getByTestId('markdown-preview');
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveProperty('innerHTML', mockRenderedContent);
    });
  });

  it('handles save and cancel buttons', async () => {
    const handleSave = jest.fn();
    const handleCancel = jest.fn();
    
    // Mock the save function to resolve immediately
    (api.save as jest.Mock).mockResolvedValue(undefined);

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

    await act(async () => {
      await Promise.resolve();
    });

    const saveButton = await screen.findByText('Save');
    const cancelButton = await screen.findByText('Cancel');

    // Click save button and wait for the save operation to complete
    await userEvent.click(saveButton);
    expect(api.save).toHaveBeenCalledWith(mockFilePath, mockInitialContent);
    expect(handleSave).toHaveBeenCalled();
    
    // Reset the mock for the next test
    (api.save as jest.Mock).mockClear();
    handleSave.mockClear();
    
    // Click cancel button
    await userEvent.click(cancelButton);
    expect(handleCancel).toHaveBeenCalled();
  });

  it('updates preview when content changes', async () => {
    const newContent = '## Updated Content';
    const newRenderedContent = '<h2>Updated Content</h2>';
    
    // Mock the render function
    (api.render as jest.Mock).mockImplementation(content => 
      Promise.resolve(content === newContent ? newRenderedContent : mockRenderedContent)
    );

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

    // Wait for initial render
    await act(async () => {
      await Promise.resolve();
    });

    const preview = await screen.findByTestId('markdown-preview');
    expect(preview).toHaveProperty('innerHTML', mockRenderedContent);

    // Update content
    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, newContent);

    // Wait for the preview to update
    await waitFor(() => {
      expect(preview.innerHTML).toBe(newRenderedContent);
    });
  });

  it('handles saving states and errors', async () => {
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

    await act(async () => {
      await Promise.resolve();
    });

    // Check saving state
    const saveButton = screen.getByText('Save');

    // Test error state
    const error = 'Failed to save content';
    (api.save as jest.Mock).mockRejectedValueOnce(new Error(error));

    await userEvent.click(saveButton);

    // Wait for the error message to appear
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(error);
  });

});
