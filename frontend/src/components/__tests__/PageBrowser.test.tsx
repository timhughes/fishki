import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageBrowser } from '../PageBrowser';
import { api } from '../../api/client';
import { MemoryRouter } from 'react-router-dom';

// Mock the API client
jest.mock('../../api/client', () => ({
  api: {
    getFiles: jest.fn(),
  },
}));

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
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
    render(
      <MemoryRouter>
        <PageBrowser onFileSelect={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByText('Loading files...')).toBeInTheDocument();
  });

  it('renders files after loading', async () => {
    render(
      <MemoryRouter>
        <PageBrowser onFileSelect={() => {}} />
      </MemoryRouter>
    );
    
    await act(async () => {
      await Promise.resolve();
    });

    const welcomeText = await screen.findByText('welcome');
    expect(welcomeText).toBeInTheDocument();
  });

  it('calls onFileSelect when clicking a file', async () => {
    const handleFileSelect = jest.fn();
    render(
      <MemoryRouter>
        <PageBrowser onFileSelect={handleFileSelect} />
      </MemoryRouter>
    );
    
    await act(async () => {
      await Promise.resolve();
    });

    const welcomeText = await screen.findByText('welcome');
    await userEvent.click(welcomeText);
    expect(handleFileSelect).toHaveBeenCalledWith('welcome.md');
  });

  it('highlights selected file', async () => {
    render(
      <MemoryRouter>
        <PageBrowser onFileSelect={() => {}} selectedFile="welcome.md" />
      </MemoryRouter>
    );
    
    await act(async () => {
      await Promise.resolve();
    });

    const fileItem = await screen.findByRole('button', { name: /welcome/i });
    expect(fileItem).toHaveClass('file-item', 'selected');
  });
});
