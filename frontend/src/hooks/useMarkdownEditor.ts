import { useEffect } from 'react';

interface UseMarkdownEditorProps {
  content: string;
  setContent: (content: string) => void;
}

interface Selection {
  start: number;
  end: number;
  text: string;
}

export const useMarkdownEditor = ({ content, setContent }: UseMarkdownEditorProps) => {
  // Effect to track changes
  useEffect(() => {
    // Log the number of textareas for debugging
    console.log('Textareas in DOM:', document.querySelectorAll('textarea').length);
    console.log('Inputs in DOM:', document.querySelectorAll('input').length);
  }, [content]);

  // Helper function to get the current selection from a textarea
  const getSelection = (textarea: HTMLTextAreaElement): Selection => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content.substring(start, end);
    
    return { start, end, text };
  };

  // Helper function to insert text at cursor position
  const insertText = (textarea: HTMLTextAreaElement, before: string, after: string = '') => {
    const { start, end } = getSelection(textarea);
    const newContent = content.substring(0, start) + before + content.substring(start, end) + after + content.substring(end);
    setContent(newContent);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  // Helper function to wrap selected text
  const wrapText = (textarea: HTMLTextAreaElement, before: string, after: string = '') => {
    const { start, end, text } = getSelection(textarea);
    const newContent = content.substring(0, start) + before + text + after + content.substring(end);
    setContent(newContent);
    
    // Set cursor position after wrapping
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + text.length);
    }, 0);
  };

  // Format functions
  const formatBold = (textarea: HTMLTextAreaElement) => {
    wrapText(textarea, '**', '**');
  };

  const formatItalic = (textarea: HTMLTextAreaElement) => {
    wrapText(textarea, '_', '_');
  };

  const formatHeading = (textarea: HTMLTextAreaElement, level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    const { start, end } = getSelection(textarea);
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    
    const beforeContent = content.substring(0, lineStart);
    const lineContent = content.substring(lineStart, end);
    const afterContent = content.substring(end);
    
    setContent(beforeContent + prefix + lineContent + afterContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + prefix.length, end + prefix.length);
    }, 0);
  };

  const formatCode = (textarea: HTMLTextAreaElement) => {
    wrapText(textarea, '`', '`');
  };

  const formatCodeBlock = (textarea: HTMLTextAreaElement) => {
    wrapText(textarea, '```\n', '\n```');
  };

  const formatLink = (textarea: HTMLTextAreaElement) => {
    const { text } = getSelection(textarea);
    if (text) {
      wrapText(textarea, '[', '](url)');
    } else {
      insertText(textarea, '[text](url)');
    }
  };

  const formatImage = (textarea: HTMLTextAreaElement) => {
    insertText(textarea, '![alt text](image-url)');
  };

  const formatBulletList = (textarea: HTMLTextAreaElement) => {
    insertText(textarea, '- ');
  };

  const formatNumberedList = (textarea: HTMLTextAreaElement) => {
    insertText(textarea, '1. ');
  };

  const formatQuote = (textarea: HTMLTextAreaElement) => {
    insertText(textarea, '> ');
  };

  const formatHorizontalRule = (textarea: HTMLTextAreaElement) => {
    insertText(textarea, '\n---\n');
  };
  
  const formatTaskList = (textarea: HTMLTextAreaElement) => {
    insertText(textarea, '- [ ] ');
  };
  
  const formatTable = (textarea: HTMLTextAreaElement) => {
    insertText(textarea, '| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n');
  };

  return {
    formatBold,
    formatItalic,
    formatHeading,
    formatCode,
    formatCodeBlock,
    formatLink,
    formatImage,
    formatBulletList,
    formatNumberedList,
    formatQuote,
    formatHorizontalRule,
    formatTaskList,
    formatTable,
    handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle tab key for indentation
      if (e.key === 'Tab') {
        e.preventDefault();
        insertText(e.currentTarget, '  ');
      }
    }
  };
};
