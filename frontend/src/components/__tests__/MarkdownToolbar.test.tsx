import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownToolbar } from '../MarkdownToolbar';

describe('MarkdownToolbar', () => {
  const mockHandlers = {
    onBold: jest.fn(),
    onItalic: jest.fn(),
    onHeading: jest.fn(),
    onCode: jest.fn(),
    onCodeBlock: jest.fn(),
    onLink: jest.fn(),
    onImage: jest.fn(),
    onBulletList: jest.fn(),
    onNumberedList: jest.fn(),
    onQuote: jest.fn(),
    onHorizontalRule: jest.fn(),
    onTaskList: jest.fn(),
    onTable: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all formatting buttons', () => {
    render(<MarkdownToolbar {...mockHandlers} />);
    
    // Check for buttons by their aria-label
    expect(screen.getByLabelText(/Bold/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Italic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Heading/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bullet List/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Numbered List/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Task List/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Inline Code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Code Block/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Link/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blockquote/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Table/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Horizontal Rule/i)).toBeInTheDocument();
  });

  test('calls the correct handler when buttons are clicked', () => {
    render(<MarkdownToolbar {...mockHandlers} />);
    
    // Click on bold button
    fireEvent.click(screen.getByLabelText(/Bold/i));
    expect(mockHandlers.onBold).toHaveBeenCalledTimes(1);
    
    // Click on italic button
    fireEvent.click(screen.getByLabelText(/Italic/i));
    expect(mockHandlers.onItalic).toHaveBeenCalledTimes(1);
    
    // Click on heading button
    fireEvent.click(screen.getByLabelText(/Heading/i));
    expect(mockHandlers.onHeading).toHaveBeenCalledTimes(1);
    
    // Click on bullet list button
    fireEvent.click(screen.getByLabelText(/Bullet List/i));
    expect(mockHandlers.onBulletList).toHaveBeenCalledTimes(1);
    
    // Click on table button
    fireEvent.click(screen.getByLabelText(/Table/i));
    expect(mockHandlers.onTable).toHaveBeenCalledTimes(1);
  });
});
