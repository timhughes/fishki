import React from 'react';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils/test-utils';
import FileBrowser from '../FileBrowser';

// Mock fetch globally
const mockedFetch = jest.fn();
global.fetch = mockedFetch;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/test' }),
}));

// Sample file tree data
const sampleFiles = [
  {
    name: 'folder1',
    type: 'folder',
    path: 'folder1',
    children: [
      {
        name: 'page1.md',
        type: 'file',
        path: 'folder1/page1.md',
      },
    ],
  },
  {
    name: 'test.md',
    type: 'file',
    path: 'test.md',
  },
];

describe('FileBrowser', () => {
  beforeEach(() => {
    mockedFetch.mockClear();
    mockNavigate.mockClear();
  });

  const openDrawer = async () => {
    fireEvent.click(screen.getByLabelText('File Browser'));
    // Wait for drawer transition
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Files' })).toBeInTheDocument();
    });
  };

  it('should render file tree', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleFiles),
      })
    );

    render(<FileBrowser />);
    await openDrawer();

    await waitFor(() => {
      expect(screen.getByText('folder1')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument(); // .md extension should be hidden
    });
  });

  it('should handle folder expansion', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleFiles),
      })
    );

    render(<FileBrowser />);
    await openDrawer();

    await waitFor(() => {
      expect(screen.getByText('folder1')).toBeInTheDocument();
    });

    // Click folder to expand
    fireEvent.click(screen.getByText('folder1'));

    // Nested file should be visible
    expect(screen.getByText('page1')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(screen.getByText('folder1'));
    expect(screen.queryByText('page1')).not.toBeInTheDocument();
  });

  it('should navigate to file on click', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleFiles),
      })
    );

    render(<FileBrowser />);
    await openDrawer();

    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('test'));
    expect(mockNavigate).toHaveBeenCalledWith('/test');
  });

  it('should create new page', async () => {
    mockedFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(sampleFiles),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
        })
      );

    render(<FileBrowser />);
    await openDrawer();

    // Open new page dialog
    fireEvent.click(screen.getByLabelText('New Page'));

    // Fill in page name
    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByLabelText(/page name/i);
    await userEvent.type(input, 'test/new-page');

    // Submit form
    fireEvent.click(within(dialog).getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith('/api/save', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          filename: 'test/new-page.md',
          content: '# new-page',
        }),
      }));
    });

    expect(mockNavigate).toHaveBeenCalledWith('/test/new-page');
  });

  it('should validate new page name', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleFiles),
      })
    );

    render(<FileBrowser />);
    await openDrawer();

    // Open dialog
    fireEvent.click(screen.getByLabelText('New Page'));

    const dialog = screen.getByRole('dialog');
    const createButton = within(dialog).getByRole('button', { name: /^create$/i });

    // Try to create with empty name
    fireEvent.click(createButton);
    expect(screen.getByText(/page name is required/i)).toBeInTheDocument();

    // Try invalid characters
    const input = within(dialog).getByLabelText(/page name/i);
    await userEvent.type(input, '///');
    fireEvent.click(createButton);
    expect(screen.getByText(/invalid page name/i)).toBeInTheDocument();
  });

  it('should refresh file list after changes', async () => {
    mockedFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(sampleFiles),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([...sampleFiles, { name: 'new.md', type: 'file', path: 'new.md' }]),
        })
      );

    render(<FileBrowser />);
    await openDrawer();

    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    // Simulate save event
    window.dispatchEvent(new Event('wiki-save'));

    await waitFor(() => {
      expect(screen.getByText('new')).toBeInTheDocument();
    });
  });

  it('should handle error loading files', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    render(<FileBrowser />);
    await openDrawer();

    await waitFor(() => {
      expect(screen.getByText(/failed to load file list/i)).toBeInTheDocument();
    });
  });

  it('should handle error creating page', async () => {
    mockedFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(sampleFiles),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
        })
      );

    render(<FileBrowser />);
    await openDrawer();

    // Open dialog and try to create page
    fireEvent.click(screen.getByLabelText('New Page'));
    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByLabelText(/page name/i);
    await userEvent.type(input, 'test-page');
    fireEvent.click(within(dialog).getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create page/i)).toBeInTheDocument();
    });
  });

  it('should properly clean page names', async () => {
    mockedFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(sampleFiles),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
        })
      );

    render(<FileBrowser />);
    await openDrawer();

    // Test with messy input
    fireEvent.click(screen.getByLabelText('New Page'));
    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByLabelText(/page name/i);
    await userEvent.type(input, '///folder///sub-folder///page.md///');
    fireEvent.click(within(dialog).getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith('/api/save', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          filename: 'folder/sub-folder/page.md',
          content: '# page',
        }),
      }));
    });
  });
});
