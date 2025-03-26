import React from 'react';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils/test-utils';
import Editor from '../Editor';

// Mock setup
const mockedFetch = jest.fn();
const mockDispatchEvent = jest.fn();
const mockNavigate = jest.fn();

global.fetch = mockedFetch;
window.dispatchEvent = mockDispatchEvent;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Editor', () => {
  const originalDispatchEvent = window.dispatchEvent;

  beforeEach(() => {
    mockedFetch.mockClear();
    mockNavigate.mockClear();
    mockDispatchEvent.mockClear();
  });

  afterEach(() => {
    window.dispatchEvent = originalDispatchEvent;
  });

  it('should show loading state initially', () => {
    mockedFetch.mockImplementationOnce(() => new Promise(() => {}));
    render(<Editor />, { initialEntries: ['/test/edit'] });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should load content successfully', async () => {
    const content = '# Test Content';
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(content),
      })
    );

    render(<Editor />, { initialEntries: ['/test/edit'] });

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue(content);
    });
  });

  it('should update content when fetchedContent changes', async () => {
    // First content load
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('# Initial Content'),
      })
    );

    const { rerender } = render(<Editor />, { initialEntries: ['/test/edit'] });

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('# Initial Content');
    });

    // Mock a new content fetch
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('# Updated Content'),
      })
    );

    // Trigger a re-render
    rerender(<Editor />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('# Updated Content');
    });
  });

  it('should switch between view modes', async () => {
    mockedFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('# Test Content'),
      })
    );

    const { waitForEffects } = render(<Editor />, { initialEntries: ['/test/edit'] });

    await act(async () => {
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      // Switch modes with proper batching
      await userEvent.click(screen.getByRole('button', { name: /preview/i }));
      await waitForEffects();
    });

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();

    // Split mode
    await userEvent.click(screen.getByRole('button', { name: /split/i }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();

    // Edit mode
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByText('Test Content', { selector: 'h1' })).not.toBeInTheDocument();
  });

  it('should save content with commit message', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('# Initial Content'),
      })
    );

    render(<Editor />, { initialEntries: ['/test/edit'] });

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Edit content
    const editor = screen.getByRole('textbox');
    await act(async () => {
      await userEvent.clear(editor);
      await userEvent.type(editor, '# New Content');
    });

    // Click save button
    await userEvent.click(screen.getByRole('button', { name: /save$/i }));

    // Check if commit dialog appears
    expect(screen.getByText(/commit message/i)).toBeInTheDocument();

    // Mock save and commit responses
    mockedFetch
      .mockImplementationOnce(() => Promise.resolve({ ok: true }))  // save response
      .mockImplementationOnce(() => Promise.resolve({ ok: true })); // commit response

    // Enter commit message and save
    const commitInput = screen.getByLabelText(/commit message/i);
    await act(async () => {
      await userEvent.type(commitInput, 'Test commit');
    });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      // Verify API calls
      expect(mockedFetch).toHaveBeenCalledTimes(3);
      expect(mockedFetch.mock.calls[1][1].body).toEqual(
        JSON.stringify({
          filename: 'test.md',
          content: '# New Content',
        })
      );
      expect(mockedFetch.mock.calls[2][1].body).toEqual(
        JSON.stringify({
          message: 'Test commit',
        })
      );
    });

    // Verify navigation and event dispatch
    expect(mockNavigate).toHaveBeenCalledWith('/test');
    expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(Event));
    expect(mockDispatchEvent.mock.calls[0][0].type).toBe('wiki-save');
  });

  it('should handle save errors', async () => {
    mockedFetch
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        text: () => Promise.resolve('# Content'),
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: false,
      }));

    render(<Editor />, { initialEntries: ['/test/edit'] });

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Try to save
    await userEvent.click(screen.getByRole('button', { name: /save$/i }));
    const commitInput = screen.getByLabelText(/commit message/i);
    await act(async () => {
      await userEvent.type(commitInput, 'Test commit');
    });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
    });
  });

  it('should update preview in real-time in split mode', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('# Initial'),
      })
    );

    render(<Editor />, { initialEntries: ['/test/edit'] });

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Switch to split mode
    await userEvent.click(screen.getByRole('button', { name: /split/i }));

    // Edit content
    const editor = screen.getByRole('textbox');
    await act(async () => {
      await userEvent.clear(editor);
      await userEvent.type(editor, '# New Title');
    });

    // Check if preview updates
    expect(screen.getByText('New Title')).toBeInTheDocument();
  });

  it('should use default commit message if none provided', async () => {
    mockedFetch
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        text: () => Promise.resolve('# Content'),
      }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true }));

    render(<Editor />, { initialEntries: ['/test/edit'] });

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Save without commit message
    await userEvent.click(screen.getByRole('button', { name: /save$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      const commitCall = mockedFetch.mock.calls[2][1].body;
      expect(JSON.parse(commitCall).message).toContain('Updated test.md');
    });
  });
});
