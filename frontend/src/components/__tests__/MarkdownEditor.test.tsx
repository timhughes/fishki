import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownEditor } from '../MarkdownEditor';
import { api } from '../../api/client';

jest.mock('../../api/client', () => ({
  api: {
    save: jest.fn(),
  },
}));

describe('MarkdownEditor', () => {
  const mockInitialContent = '# Test Content';
  const mockFilePath = 'test.md';

  beforeEach(() => {
    (api.save as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders with initial content', () => {
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
  });

  it('handles content changes', async () => {
    render(
      <MarkdownEditor
        filePath={mockFilePath}
        initialContent={mockInitialContent}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, ' - Updated');
    expect((textarea as HTMLTextAreaElement).value).toBe(mockInitialContent + ' - Updated');
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
});
