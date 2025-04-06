import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarkdownEditor } from '../MarkdownEditor';
import { api } from '../../api/client';
import { NavigationProvider } from '../../contexts/NavigationContext';
import { MemoryRouter } from 'react-router-dom';

// Mock the API
jest.mock('../../api/client', () => ({
  api: {
    save: jest.fn().mockResolvedValue({}),
    render: jest.fn().mockResolvedValue('<h1>Test Content</h1>')
  }
}));

// Mock the useNavigation hook
jest.mock('../../contexts/NavigationContext', () => {
  const actual = jest.requireActual('../../contexts/NavigationContext');
  return {
    ...actual,
    useNavigation: () => ({
      setBlockNavigation: jest.fn(),
      setHasUnsavedChanges: jest.fn(),
      blockNavigation: false,
      hasUnsavedChanges: false,
      pendingLocation: null,
      setPendingLocation: jest.fn(),
      confirmNavigation: jest.fn(),
      cancelNavigation: jest.fn(),
      setNavigationCallback: jest.fn()
    })
  };
});

// Mock ReactMarkdown to avoid issues with ESM imports
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => {
    return <div data-testid="markdown-content">{children}</div>;
  }
}));

// Create a wrapper component that provides the necessary context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <MemoryRouter>
      <NavigationProvider>
        {children}
      </NavigationProvider>
    </MemoryRouter>
  );
};

describe('MarkdownEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders editor with initial content', () => {
    render(
      <MarkdownEditor 
        filePath="test.md"
        initialContent="# Test Content"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
      { wrapper: TestWrapper }
    );
    
    // Check if the editor contains the initial content
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('# Test Content');
  });
  
  test('saves content when save button is clicked', async () => {
    render(
      <MarkdownEditor 
        filePath="test.md"
        initialContent="# Test Content"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
      { wrapper: TestWrapper }
    );
    
    // Edit the content
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '# Modified Content' } });
    
    // Click save button
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // Check if API was called with correct parameters
    await waitFor(() => {
      expect(api.save).toHaveBeenCalledWith('test.md', '# Modified Content');
      expect(mockOnSave).toHaveBeenCalled();
    });
  });
  
  test('calls onCancel when cancel button is clicked', () => {
    render(
      <MarkdownEditor 
        filePath="test.md"
        initialContent="# Test Content"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
      { wrapper: TestWrapper }
    );
    
    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Check if onCancel was called
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
