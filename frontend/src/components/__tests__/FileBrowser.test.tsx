import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileBrowser } from '../FileBrowser';
import { api } from '../../api/client';

// Mock the API client
jest.mock('../../api/client', () => ({
  api: {
    getFiles: jest.fn(),
  },
}));

describe('FileBrowser', () => {
  const mockFiles = [
    {
      name: 'welcome.md',
      type: 'file',
      path: 'welcome.md',
    },
  ];

  beforeEach(() => {
    (api.getFiles as jest.Mock).mockResolvedValue(mockFiles);
  });

  it('renders loading state initially', () => {
    render(<FileBrowser onFileSelect={() => {}} />);
    expect(screen.getByText('Loading files...')).toBeInTheDocument();
  });

  it('renders files after loading', async () => {
    render(<FileBrowser onFileSelect={() => {}} />);
    
    await waitFor(() => {
      const welcomeText = screen.getByText((content) => content.includes('welcome'));
      expect(welcomeText).toBeInTheDocument();
    });
  });

  it('calls onFileSelect when clicking a file', async () => {
    const handleFileSelect = jest.fn();
    render(<FileBrowser onFileSelect={handleFileSelect} />);
    
    await waitFor(() => {
      const welcomeText = screen.getByText((content) => content.includes('welcome'));
      expect(welcomeText).toBeInTheDocument();
    });

    const fileItem = screen.getByText((content) => content.includes('welcome'));
    await userEvent.click(fileItem);
    expect(handleFileSelect).toHaveBeenCalledWith('welcome.md');
  });

  it('highlights selected file', async () => {
    render(<FileBrowser onFileSelect={() => {}} selectedFile="welcome.md" />);
    
    await waitFor(() => {
      const fileElement = screen.getByText((content) => content.includes('welcome')).closest('.file-item');
      expect(fileElement).toHaveClass('selected');
    });
  });
});
