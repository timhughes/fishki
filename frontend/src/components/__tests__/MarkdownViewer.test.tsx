import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownViewer } from '../MarkdownViewer';
import { api } from '../../api/client';

jest.mock('../../api/client', () => ({
  api: {
    load: jest.fn(),
    render: jest.fn(),
  },
}));

describe('MarkdownViewer', () => {
  const mockContent = '# Test Content';
  const mockRenderedContent = '<h1>Test Content</h1>';

  beforeEach(() => {
    (api.load as jest.Mock).mockResolvedValue(mockContent);
    (api.render as jest.Mock).mockResolvedValue(mockRenderedContent);
  });

  it('renders loading state initially', () => {
    render(<MarkdownViewer filePath="test.md" onEdit={() => {}} />);
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('renders content after loading', async () => {
    render(<MarkdownViewer filePath="test.md" onEdit={() => {}} />);
    
    await waitFor(() => {
      const content = document.querySelector('.markdown-content');
      expect(content).toBeInTheDocument();
      expect(content?.innerHTML).toBe(mockRenderedContent);
    });
  });

  it('handles edit button click', async () => {
    const handleEdit = jest.fn();
    render(<MarkdownViewer filePath="test.md" onEdit={handleEdit} />);
    
    await waitFor(() => {
      const editButton = screen.getByText('Edit');
      expect(editButton).toBeInTheDocument();
      userEvent.click(editButton);
      expect(handleEdit).toHaveBeenCalled();
    });
  });

  it('displays error state when loading fails', async () => {
    const error = 'Failed to load content';
    (api.load as jest.Mock).mockRejectedValue(new Error(error));

    render(<MarkdownViewer filePath="test.md" onEdit={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText(`Error: ${error}`)).toBeInTheDocument();
    });
  });

  it('shows no file selected when filePath is empty', () => {
    render(<MarkdownViewer filePath="" onEdit={() => {}} />);
    expect(screen.getByText('No file selected')).toBeInTheDocument();
  });
});
