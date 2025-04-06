import { renderHook } from '@testing-library/react';
import { useMarkdownEditor } from '../useMarkdownEditor';

// Mock the textarea ref
const mockTextFieldRef = {
  current: {
    focus: jest.fn(),
    setSelectionRange: jest.fn(),
    selectionStart: 0,
    selectionEnd: 0,
  },
};

// Mock React's useRef to return our mock
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useRef: jest.fn(() => mockTextFieldRef),
}));

describe('useMarkdownEditor', () => {
  const mockSetContent = jest.fn();
  const initialContent = 'Initial content';
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockTextFieldRef.current.selectionStart = 0;
    mockTextFieldRef.current.selectionEnd = 0;
  });
  
  test('handleKeyDown processes keyboard shortcuts', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    // Mock event for Ctrl+B
    const boldEvent = {
      ctrlKey: true,
      key: 'b',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;
    
    result.current.handleKeyDown(boldEvent);
    
    expect(boldEvent.preventDefault).toHaveBeenCalled();
    expect(mockSetContent).toHaveBeenCalled();
    
    // Mock event for Ctrl+I
    mockSetContent.mockClear();
    const italicEvent = {
      ctrlKey: true,
      key: 'i',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;
    
    result.current.handleKeyDown(italicEvent);
    
    expect(italicEvent.preventDefault).toHaveBeenCalled();
    expect(mockSetContent).toHaveBeenCalled();
  });
});
