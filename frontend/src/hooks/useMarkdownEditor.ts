import { useRef } from 'react';

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
  const textFieldRef = useRef<HTMLTextAreaElement | null>(null);

  // Helper function to get the current selection
  const getSelection = (): Selection => {
    const textField = textFieldRef.current;
    if (!textField) {
      return { start: 0, end: 0, text: '' };
    }
    
    const start = textField.selectionStart;
    const end = textField.selectionEnd;
    const text = content.substring(start, end);
    
    return { start, end, text };
  };

  // Helper function to insert text at cursor position
  const insertText = (before: string, after: string = '') => {
    const textField = textFieldRef.current;
    if (!textField) return;
    
    const { start, end, text } = getSelection();
    const newContent = 
      content.substring(0, start) + 
      before + 
      text + 
      after + 
      content.substring(end);
    
    setContent(newContent);
    
    // Focus back on the text field and set cursor position
    setTimeout(() => {
      textField.focus();
      const newPosition = start + before.length + text.length + after.length;
      textField.setSelectionRange(
        text ? start + before.length : newPosition,
        text ? end + before.length : newPosition
      );
    }, 0);
  };

  // Formatting functions
  const formatBold = () => insertText('**', '**');
  const formatItalic = () => insertText('*', '*');
  const formatHeading = () => {
    const { start } = getSelection();
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const linePrefix = content.substring(lineStart, start);
    
    // Check if line already starts with #
    if (linePrefix.trim().startsWith('#')) {
      // Add one more # to increase heading level
      insertText('#', '');
    } else {
      // Add new heading
      insertText('# ', '');
    }
  };
  const formatCode = () => insertText('`', '`');
  const formatCodeBlock = () => insertText('```\n', '\n```');
  const formatLink = () => insertText('[', '](url)');
  const formatImage = () => insertText('![alt text](', ')');
  const formatBulletList = () => insertText('- ');
  const formatNumberedList = () => insertText('1. ');
  const formatQuote = () => insertText('> ');
  const formatHorizontalRule = () => insertText('\n---\n');
  const formatTaskList = () => insertText('- [ ] ');
  const formatTable = () => {
    insertText(
      '| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Row 1, Col 1 | Row 1, Col 2 | Row 1, Col 3 |\n| Row 2, Col 1 | Row 2, Col 2 | Row 2, Col 3 |'
    );
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+B for bold
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      formatBold();
    }
    // Ctrl+I for italic
    else if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      formatItalic();
    }
    // Ctrl+K for link
    else if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      formatLink();
    }
  };

  return {
    textFieldRef,
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
    handleKeyDown
  };
};
