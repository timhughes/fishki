import { render, screen, waitFor, act } from '@testing-library/react';
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
    render(<MarkdownViewer filePath="test.md" onEdit={() => {}} onDelete={() => {}} onNotFound={() => null} />);
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('renders content after loading', async () => {
    render(<MarkdownViewer filePath="test.md" onEdit={() => {}} onDelete={() => {}} onNotFound={() => null} />);

    // First verify loading state
    expect(screen.getByText('Loading content...')).toBeInTheDocument();

    // Mock the API responses
    await act(async () => {
      await Promise.resolve(); // Let the first render complete
    });

    // Wait for content to be rendered
    await waitFor(() => {
      const content = screen.getByRole('article', { name: 'test' });
      expect(content).toHaveClass('markdown-content');
      expect(content).toHaveProperty('innerHTML', mockRenderedContent);
    });
  });

  it('handles edit button click', async () => {
    const handleEdit = jest.fn();
    render(<MarkdownViewer filePath="test.md" onEdit={handleEdit} onDelete={() => {}} onNotFound={() => null} />);

    // Wait for content to load
    await act(async () => {
      await Promise.resolve();
    });

    const editButton = await screen.findByRole('button', { name: /edit/i });
    await userEvent.click(editButton);
    expect(handleEdit).toHaveBeenCalled();
  });

  it('displays error state when loading fails', async () => {
    const error = 'Failed to load content';
    (api.load as jest.Mock).mockRejectedValue(new Error(error));

    render(<MarkdownViewer filePath="test.md" onEdit={() => {}} onDelete={() => {}} onNotFound={() => null} />);
    
    // Wait for error state to be rendered
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(`Error: ${error}`);
    });
  });

  it('shows no file selected when filePath is empty', () => {
    render(<MarkdownViewer filePath="" onEdit={() => {}} onDelete={() => {}} onNotFound={() => null} />);
    expect(screen.getByText('No file selected')).toBeInTheDocument();
  });
});
