import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownEditor } from '../MarkdownEditor';
import { api } from '../../api/client';

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
      <MarkdownEditor
        filePath={mockFilePath}
        initialContent={mockInitialContent}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe(mockInitialContent);

    await waitFor(() => {
      const preview = document.querySelector('.markdown-content');
      expect(preview).toBeInTheDocument();
      expect(preview?.innerHTML).toBe(mockRenderedContent);
    });
  });

  it('updates preview when content changes', async () => {
    const newContent = '## Updated Content';
    const newRenderedContent = '<h2>Updated Content</h2>';
    
    // Mock the render function for all calls
    (api.render as jest.Mock).mockImplementation(content => {
      if (content === newContent) {
        return Promise.resolve(newRenderedContent);
      }
      return Promise.resolve(mockRenderedContent);
    });

    render(
      <MarkdownEditor
        filePath={mockFilePath}
        initialContent={mockInitialContent}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    // Wait for initial render
    await waitFor(() => {
      const preview = document.querySelector('.markdown-content');
      expect(preview?.innerHTML).toBe(mockRenderedContent);
    });

    // Update content
    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, newContent);

    // Wait for the preview to update with the new content
    await waitFor(() => {
      const preview = document.querySelector('.markdown-content');
      expect(preview?.innerHTML).toBe(newRenderedContent);
    }, { timeout: 3000 });
  });

  it('handles save button click', async () => {
    const handleSave = jest.fn();
    render(
      <MarkdownEditor
        filePath={mockFilePath}
        initialContent={mockInitialContent}
        onSave={handleSave}
        onCancel={() => {}}
      />
    );

    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);

    expect(api.save).toHaveBeenCalledWith(mockFilePath, mockInitialContent);
    await waitFor(() => {
      expect(handleSave).toHaveBeenCalled();
    });
  });

  it('handles cancel button click', async () => {
    const handleCancel = jest.fn();
    render(
      <MarkdownEditor
        filePath={mockFilePath}
        initialContent={mockInitialContent}
        onSave={() => {}}
        onCancel={handleCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);

    expect(handleCancel).toHaveBeenCalled();
  });

  it('disables buttons and textarea while saving', async () => {
    let resolveApiCall: (value: unknown) => void;
    (api.save as jest.Mock).mockImplementation(() => new Promise(resolve => {
      resolveApiCall = resolve;
    }));

    render(
      <MarkdownEditor
        filePath={mockFilePath}
        initialContent={mockInitialContent}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    const saveButton = screen.getByText('Save');
    const cancelButton = screen.getByText('Cancel');
    const textarea = screen.getByRole('textbox');

    await userEvent.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(textarea).toBeDisabled();
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    resolveApiCall!(undefined);
  });

  it('displays error message on save failure', async () => {
    const error = 'Failed to save content';
    (api.save as jest.Mock).mockRejectedValue(new Error(error));

    render(
      <MarkdownEditor
        filePath={mockFilePath}
        initialContent={mockInitialContent}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(error)).toBeInTheDocument();
    });
  });

  it('updates preview correctly when content changes', async () => {
    const newContent = '## Updated Content';
    const newRenderedContent = '<h2>Updated Content</h2>';
    
    // Mock the render function for all calls
    (api.render as jest.Mock).mockImplementation(content => {
      if (content === newContent) {
        return Promise.resolve(newRenderedContent);
      }
      return Promise.resolve(mockRenderedContent);
    });

    render(
      <MarkdownEditor
        filePath={mockFilePath}
        initialContent={mockInitialContent}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    // Wait for initial render
    await waitFor(() => {
      const preview = document.querySelector('.markdown-content');
      expect(preview?.innerHTML).toBe(mockRenderedContent);
    });

    // Update content
    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, newContent);

    // Wait for the preview to update with the new content
    await waitFor(() => {
      const preview = document.querySelector('.markdown-content');
      expect(preview?.innerHTML).toBe(newRenderedContent);
    }, { timeout: 3000 });
  });
});
