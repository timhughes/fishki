import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageBrowser } from '../PageBrowser';
import { api } from '../../api/client';

// Mock the API client
jest.mock('../../api/client', () => ({
  api: {
    getFiles: jest.fn(),
  },
}));

describe('PageBrowser', () => {
  const mockFiles = {
    files: [
      {
        name: 'welcome.md',
        type: 'file',
        path: 'welcome.md',
      }
    ]
  };

  beforeEach(() => {
    (api.getFiles as jest.Mock).mockResolvedValue(mockFiles.files);
  });

  it('renders loading state initially', () => {
    render(<PageBrowser onFileSelect={() => {}} />);
    expect(screen.getByText('Loading files...')).toBeInTheDocument();
  });

  it('renders files after loading', async () => {
    render(<PageBrowser onFileSelect={() => {}} />);
    
    await act(async () => {
      await Promise.resolve();
    });

    const welcomeText = await screen.findByText('welcome');
    expect(welcomeText).toBeInTheDocument();
  });

  it('calls onFileSelect when clicking a file', async () => {
    const handleFileSelect = jest.fn();
    render(<PageBrowser onFileSelect={handleFileSelect} />);
    
    await act(async () => {
      await Promise.resolve();
    });

    const welcomeText = await screen.findByText('welcome');
    await userEvent.click(welcomeText);
    expect(handleFileSelect).toHaveBeenCalledWith('welcome.md');
  });

  it('highlights selected file', async () => {
    render(<PageBrowser onFileSelect={() => {}} selectedFile="welcome.md" />);
    
    await act(async () => {
      await Promise.resolve();
    });

    const fileItem = await screen.findByRole('button', { name: /welcome/i });
    expect(fileItem).toHaveClass('file-item', 'selected');
  });
});
