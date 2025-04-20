import { renderHook, act } from '@testing-library/react';
import { useMarkdownEditor } from '../useMarkdownEditor';

// Mock console.log to avoid cluttering test output
console.log = jest.fn();

describe('useMarkdownEditor', () => {
  const mockSetContent = jest.fn();
  const initialContent = 'Initial content';
  
  // Create a mock textarea element
  const createMockTextArea = () => {
    const textarea = document.createElement('textarea');
    textarea.value = initialContent;
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;
    
    // Mock focus and setSelectionRange
    textarea.focus = jest.fn();
    textarea.setSelectionRange = jest.fn();
    
    return textarea;
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('returns textAreaRef and formatting functions', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    expect(result.current.textAreaRef).toBeDefined();
    expect(result.current.handleToolbarAction).toBeInstanceOf(Function);
    expect(result.current.formatBold).toBeInstanceOf(Function);
    expect(result.current.formatItalic).toBeInstanceOf(Function);
    expect(result.current.handleKeyDown).toBeInstanceOf(Function);
  });
  
  test('formatBold wraps text with ** markers', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 8;
    mockTextArea.selectionEnd = 15;
    
    act(() => {
      result.current.formatBold(mockTextArea);
    });
    
    expect(mockSetContent).toHaveBeenCalledWith('Initial **content**');
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(10, 17);
  });
  
  test('formatItalic wraps text with _ markers', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 8;
    mockTextArea.selectionEnd = 15;
    
    act(() => {
      result.current.formatItalic(mockTextArea);
    });
    
    expect(mockSetContent).toHaveBeenCalledWith('Initial _content_');
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(9, 16);
  });
  
  test('formatHeading adds heading markers', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 0;
    mockTextArea.selectionEnd = 15;
    
    act(() => {
      result.current.formatHeading(mockTextArea, 2);
    });
    
    expect(mockSetContent).toHaveBeenCalledWith('## Initial content');
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(3, 18);
  });
  
  test('formatCode wraps text with backticks', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 8;
    mockTextArea.selectionEnd = 15;
    
    act(() => {
      result.current.formatCode(mockTextArea);
    });
    
    expect(mockSetContent).toHaveBeenCalledWith('Initial `content`');
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(9, 16);
  });
  
  test('formatCodeBlock wraps text with triple backticks', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 8;
    mockTextArea.selectionEnd = 15;
    
    act(() => {
      result.current.formatCodeBlock(mockTextArea);
    });
    
    expect(mockSetContent).toHaveBeenCalledWith('Initial ```\ncontent\n```');
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(12, 19);
  });
  
  test('formatLink adds link syntax with selected text', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 8;
    mockTextArea.selectionEnd = 15;
    
    act(() => {
      result.current.formatLink(mockTextArea);
    });
    
    expect(mockSetContent).toHaveBeenCalledWith('Initial [content](url)');
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(9, 16);
  });
  
  test('formatLink adds link syntax without selected text', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 8;
    mockTextArea.selectionEnd = 8;
    
    act(() => {
      result.current.formatLink(mockTextArea);
    });
    
    expect(mockSetContent).toHaveBeenCalledWith('Initial [text](url)content');
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    // The cursor should be positioned after the inserted text
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(19, 19);
  });
  
  test('formatImage adds image syntax', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 8;
    mockTextArea.selectionEnd = 8;
    
    act(() => {
      result.current.formatImage(mockTextArea);
    });
    
    expect(mockSetContent).toHaveBeenCalledWith('Initial ![alt text](image-url)content');
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    // The cursor should be positioned after the inserted text
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(30, 30);
  });
  
  test('formatBulletList adds bullet list marker', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 8;
    mockTextArea.selectionEnd = 8;
    
    act(() => {
      result.current.formatBulletList(mockTextArea);
    });
    
    expect(mockSetContent).toHaveBeenCalledWith('Initial - content');
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(10, 10);
  });
  
  test('formatNumberedList adds numbered list marker', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 8;
    mockTextArea.selectionEnd = 8;
    
    act(() => {
      result.current.formatNumberedList(mockTextArea);
    });
    
    expect(mockSetContent).toHaveBeenCalledWith('Initial 1. content');
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(11, 11);
  });
  
  test('formatQuote adds quote marker', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 8;
    mockTextArea.selectionEnd = 8;
    
    act(() => {
      result.current.formatQuote(mockTextArea);
    });
    
    expect(mockSetContent).toHaveBeenCalledWith('Initial > content');
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(10, 10);
  });
  
  test('formatHorizontalRule adds horizontal rule', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 8;
    mockTextArea.selectionEnd = 8;
    
    act(() => {
      result.current.formatHorizontalRule(mockTextArea);
    });
    
    expect(mockSetContent).toHaveBeenCalledWith('Initial \n---\ncontent');
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(13, 13);
  });
  
  test('formatTaskList adds task list marker', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 8;
    mockTextArea.selectionEnd = 8;
    
    act(() => {
      result.current.formatTaskList(mockTextArea);
    });
    
    expect(mockSetContent).toHaveBeenCalledWith('Initial - [ ] content');
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(14, 14);
  });
  
  test('formatTable adds table syntax', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 8;
    mockTextArea.selectionEnd = 8;
    
    act(() => {
      result.current.formatTable(mockTextArea);
    });
    
    const expectedTable = 'Initial | Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\ncontent';
    expect(mockSetContent).toHaveBeenCalledWith(expectedTable);
    
    // Check that focus and selection were set
    act(() => {
      jest.runAllTimers();
    });
    
    expect(mockTextArea.focus).toHaveBeenCalled();
    // The cursor should be positioned after the inserted text (before "content")
    expect(mockTextArea.setSelectionRange).toHaveBeenCalledWith(80, 80);
  });
  
  test('handleKeyDown processes Tab key', () => {
    const { result } = renderHook(() => 
      useMarkdownEditor({ content: initialContent, setContent: mockSetContent })
    );
    
    const mockTextArea = createMockTextArea();
    mockTextArea.selectionStart = 0;
    mockTextArea.selectionEnd = 0;
    
    const mockEvent = {
      key: 'Tab',
      preventDefault: jest.fn(),
      currentTarget: mockTextArea
    };
    
    act(() => {
      result.current.handleKeyDown(mockEvent as any);
    });
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockSetContent).toHaveBeenCalledWith('  Initial content');
  });
});
