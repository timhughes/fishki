import React from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown components={{ code: CodeBlock }}>
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
