import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../test-utils/test-utils';
import { Routes, Route } from 'react-router-dom';
import WikiPage from '../WikiPage';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Routes>
    <Route path="/" element={children} />
    <Route path="/:filename" element={children} />
    <Route path="/:filename/edit" element={children} />
  </Routes>
);

// Mock setup
const mockedFetch = jest.fn();
const mockLocation = { ...window.location, reload: jest.fn() };

global.fetch = mockedFetch;

describe('WikiPage', () => {
  beforeEach(() => {
    mockedFetch.mockClear();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: mockLocation,
    });
    mockLocation.reload.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should show loading state initially', () => {
    mockedFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    render(<TestWrapper><WikiPage /></TestWrapper>, { initialEntries: ['/test'] });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render markdown content with formatting', async () => {
    const markdownContent = '# Test Content';

    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(markdownContent),
      })
    );

    render(<TestWrapper><WikiPage /></TestWrapper>, { initialEntries: ['/test'] });

    await waitFor(() => {
      const container = screen.getByTestId('markdown-container');
      const markdown = screen.getByTestId('markdown');
      expect(container).toBeInTheDocument();
      expect(markdown).toBeInTheDocument();
      expect(markdown.textContent).toBe(markdownContent);
    });
  });

  it('should display create page option for 404 response', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      })
    );

    render(<TestWrapper><WikiPage /></TestWrapper>, { initialEntries: ['/new-page'] });

    await waitFor(() => {
      expect(screen.getByText('This page does not exist.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create page/i })).toBeInTheDocument();
    });
  });

  it('should create new page with default content', async () => {
    mockedFetch
      .mockImplementationOnce(() => Promise.resolve({ ok: false, status: 404 }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true }));

    const path = '/new-page';
    render(<TestWrapper><WikiPage /></TestWrapper>, { initialEntries: [path] });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create page/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /create page/i }));

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledTimes(2);
      expect(mockedFetch.mock.calls[1][1]).toEqual({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'new-page.md',
          content: '# new-page',
        }),
      });
      expect(mockLocation.reload).toHaveBeenCalled();
    });
  });

  it('should display error message for server errors', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    render(<TestWrapper><WikiPage /></TestWrapper>, { initialEntries: ['/test'] });

    await waitFor(() => {
      expect(screen.getByText('Failed to load page')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /create page/i })).not.toBeInTheDocument();
    });
  });

  it('should show empty state message for empty content', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(''),
      })
    );

    render(<TestWrapper><WikiPage /></TestWrapper>, { initialEntries: ['/empty-page'] });

    await waitFor(() => {
      expect(screen.getByText('This page is empty. Click Edit to add content.')).toBeInTheDocument();
    });
  });

  it('should load index.md for root path', async () => {
    const indexContent = '# Index Content';
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(indexContent),
      })
    );

    render(<TestWrapper><WikiPage /></TestWrapper>, { initialEntries: ['/'] });

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith('/api/load?filename=index.md');
      const container = screen.getByTestId('markdown-container');
      const markdown = screen.getByTestId('markdown');
      expect(container).toBeInTheDocument();
      expect(markdown.textContent).toBe(indexContent);
    });
  });
});
