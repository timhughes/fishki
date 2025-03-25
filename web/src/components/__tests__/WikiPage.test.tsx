import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../test-utils/test-utils';
import WikiPage from '../WikiPage';

// Mock fetch globally
const mockedFetch = jest.fn();
global.fetch = mockedFetch;

describe('WikiPage', () => {
  beforeEach(() => {
    mockedFetch.mockClear();
  });

  it('should show loading state initially', () => {
    mockedFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    render(<WikiPage />, { initialEntries: ['/test'] });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render markdown content when loading succeeds', async () => {
    const markdownContent = `
# Test Content
## Subheading
- List item 1
- List item 2

\`\`\`javascript
console.log('test');
\`\`\`
`;

    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(markdownContent),
      })
    );

    render(<WikiPage />, { initialEntries: ['/test'] });

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Subheading')).toBeInTheDocument();
      expect(screen.getByText('List item 1')).toBeInTheDocument();
      expect(screen.getByText('List item 2')).toBeInTheDocument();
      expect(screen.getByText("console.log('test')")).toBeInTheDocument();
    });
  });

  it('should show create page button for 404', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      })
    );

    render(<WikiPage />, { initialEntries: ['/new-page'] });

    await waitFor(() => {
      expect(screen.getByText('This page does not exist.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create page/i })).toBeInTheDocument();
    });
  });

  it('should handle page creation', async () => {
    // Mock 404 response
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      })
    );

    // Mock successful page creation
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
      })
    );

    const mockLocation = { ...window.location, reload: jest.fn() };
    Object.defineProperty(window, 'location', {
      writable: true,
      value: mockLocation,
    });

    render(<WikiPage />, { initialEntries: ['/new-page'] });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create page/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /create page/i }));

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledTimes(2);
      expect(mockedFetch.mock.calls[1][1].body).toEqual(
        JSON.stringify({
          filename: 'new-page.md',
          content: '# new-page',
        })
      );
      expect(mockLocation.reload).toHaveBeenCalled();
    });
  });

  it('should show error message for non-404 errors', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    render(<WikiPage />, { initialEntries: ['/test'] });

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

    render(<WikiPage />, { initialEntries: ['/empty-page'] });

    await waitFor(() => {
      expect(screen.getByText('This page is empty. Click Edit to add content.')).toBeInTheDocument();
    });
  });

  it('should use index for root path', async () => {
    mockedFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('# Index Content'),
      })
    );

    render(<WikiPage />, { initialEntries: ['/'] });

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith(expect.stringContaining('index.md'));
      expect(screen.getByText('Index Content')).toBeInTheDocument();
    });
  });
});
