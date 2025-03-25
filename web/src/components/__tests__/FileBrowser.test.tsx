import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { render } from '../../test-utils/test-utils';
import userEvent from '@testing-library/user-event';
import FileBrowser from '../FileBrowser';

const mockedFetch = jest.fn();
const mockNavigate = jest.fn();

global.fetch = mockedFetch;

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/test' }),
  };
});

// Test data
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
  const originalDispatchEvent = window.dispatchEvent;

  beforeEach(() => {
    mockedFetch.mockClear();
    mockNavigate.mockClear();
    window.dispatchEvent = originalDispatchEvent;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const openDrawer = async () => {
    await userEvent.click(screen.getByLabelText('File Browser'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Files' })).toBeInTheDocument();
    });
  };

  const createNewPage = async (dialogInput: string) => {
    await userEvent.click(screen.getByLabelText('New Page'));
    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByLabelText(/page name/i);
    await userEvent.type(input, dialogInput);
    await userEvent.click(within(dialog).getByRole('button', { name: /^create$/i }));
  };

  it('should display file tree structure', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleFiles),
      })
    );

    render(<FileBrowser />, { initialEntries: ['/test'] });
    await openDrawer();

    expect(screen.getByText('folder1')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('should expand and collapse folders', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleFiles),
      })
    );

    render(<FileBrowser />, { initialEntries: ['/test'] });
    await openDrawer();

    expect(screen.getByText('folder1')).toBeInTheDocument();

    await userEvent.click(screen.getByText('folder1'));
    expect(screen.getByText('page1')).toBeInTheDocument();

    await userEvent.click(screen.getByText('folder1'));
    expect(screen.queryByText('page1')).not.toBeInTheDocument();
  });

  it('should navigate to selected file', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleFiles),
      })
    );

    render(<FileBrowser />, { initialEntries: ['/test'] });
    await openDrawer();

    expect(screen.getByText('test')).toBeInTheDocument();
    await userEvent.click(screen.getByText('test'));
    expect(mockNavigate).toHaveBeenCalledWith('/test');
  });

  it('should create new page with default content', async () => {
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

    render(<FileBrowser />, { initialEntries: ['/test'] });
    await openDrawer();
    await createNewPage('test/new-page');

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

    render(<FileBrowser />, { initialEntries: ['/test'] });
    await openDrawer();

    await userEvent.click(screen.getByLabelText('New Page'));
    const dialog = screen.getByRole('dialog');
    const createButton = within(dialog).getByRole('button', { name: /^create$/i });

    // Try to create with empty name
    await userEvent.click(createButton);
    expect(screen.getByText(/page name is required/i)).toBeInTheDocument();

    // Try empty after trim
    const input = within(dialog).getByLabelText(/page name/i);
    await userEvent.type(input, '   ');
    await userEvent.click(createButton);
    expect(screen.getByText(/invalid page name/i)).toBeInTheDocument();
  });

  it('should refresh file list after content changes', async () => {
    const updatedFiles = [...sampleFiles, { name: 'new.md', type: 'file', path: 'new.md' }];
    
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
          json: () => Promise.resolve(updatedFiles),
        })
      );

    render(<FileBrowser />, { initialEntries: ['/test'] });
    await openDrawer();

    expect(screen.getByText('test')).toBeInTheDocument();

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

    render(<FileBrowser />, { initialEntries: ['/test'] });
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

    render(<FileBrowser />, { initialEntries: ['/test'] });
    await openDrawer();

    await createNewPage('test-page');

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

    render(<FileBrowser />, { initialEntries: ['/test'] });
    await openDrawer();
    await createNewPage('//folder//sub-folder//page//');

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
