import React from 'react';

interface MarkdownProps {
  children: string;
  components?: Record<string, unknown>;
}

const ReactMarkdown: React.FC<MarkdownProps> = ({ children }) => {
  return <div data-testid="markdown">{children}</div>;
};

export default ReactMarkdown;
