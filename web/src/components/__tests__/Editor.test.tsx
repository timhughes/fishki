import React from 'react';
import { screen, waitFor, fireEvent, act, within } from '@testing-library/react';
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
  beforeEach(() => {
    mockedFetch.mockClear();
    mockNavigate.mockClear();
    mockDispatchEvent.mockClear();
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
    mockedFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('# Initial Content'),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('# Updated Content'),
        })
      );

    const { rerender } = render(<Editor key="1" />, { initialEntries: ['/test/edit'] });
    await screen.findByDisplayValue('# Initial Content');

    // Re-render with new key to force re-fetch
    await act(async () => {
      rerender(<Editor key="2" />);
    });

    await screen.findByDisplayValue('# Updated Content');
  });

  it('should switch between view modes', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('# Test Content'),
      })
    );

    render(<Editor />, { initialEntries: ['/test/edit'] });
    await screen.findByDisplayValue('# Test Content');

    // Preview mode
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /preview/i }));
    });

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();

    // Split mode
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /split/i }));
    });

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should handle save functionality', async () => {
    mockedFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('# Initial Content'),
        })
      )
      .mockImplementationOnce(() => Promise.resolve({ ok: true }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true }));

    render(<Editor />, { initialEntries: ['/test/edit'] });
    const editor = await screen.findByRole('textbox');

    // Edit content
    await userEvent.clear(editor);
    await userEvent.type(editor, '# New Content');

    // Open dialog
    await userEvent.click(screen.getByRole('button', { name: /save$/i }));

    // Handle commit dialog
    const dialog = await screen.findByRole('dialog');
    const commitInput = within(dialog).getByLabelText(/commit message/i);
    await userEvent.type(commitInput, 'Test commit');
    await userEvent.click(within(dialog).getByRole('button', { name: /^save$/i }));

    // Verify API calls
    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledTimes(3);
      expect(JSON.parse(mockedFetch.mock.calls[1][1].body)).toEqual({
        filename: 'index.md',
        content: '# New Content',
      });
      expect(JSON.parse(mockedFetch.mock.calls[2][1].body)).toEqual({
        message: 'Test commit',
      });
    });
  });

  it('should handle save errors', async () => {
    mockedFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('# Content'),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Save failed',
        })
      );

    render(<Editor />, { initialEntries: ['/test/edit'] });
    await screen.findByRole('textbox');

    // Try to save
    await userEvent.click(screen.getByRole('button', { name: /save$/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/commit message/i), 'Test commit');
    await userEvent.click(within(dialog).getByRole('button', { name: /^save$/i }));

    // Wait for error alert
    await screen.findByRole('alert');
  });

  it('should update preview in real-time in split mode', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('# Initial'),
      })
    );

    render(<Editor />, { initialEntries: ['/test/edit'] });
    const editor = await screen.findByRole('textbox');

    // Enter split mode
    await userEvent.click(screen.getByRole('button', { name: /split/i }));
    
    // Edit content
    await act(async () => {
      await userEvent.clear(editor);
      await userEvent.type(editor, '# New Title');
    });

    // Wait for preview update
    await screen.findByText('New Title');
  });

  it('should use default commit message if none provided', async () => {
    mockedFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('# Content'),
        })
      )
      .mockImplementationOnce(() => Promise.resolve({ ok: true }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true }));

    render(<Editor />, { initialEntries: ['/test/edit'] });
    await screen.findByRole('textbox');

    // Save without commit message
    await userEvent.click(screen.getByRole('button', { name: /save$/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /^save$/i }));

    // Verify default commit message
    await waitFor(() => {
      const commitCall = mockedFetch.mock.calls[2][1].body;
      expect(JSON.parse(commitCall).message).toContain('Updated index.md');
    });
  });
});
