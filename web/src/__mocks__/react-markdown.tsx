import React from 'react';

interface MarkdownProps {
  children: string;
  components?: Record<string, unknown>;
}

const ReactMarkdown: React.FC<MarkdownProps> = ({ children, components }) => {
  return (
    <div 
      data-testid="markdown" 
      data-components={JSON.stringify(components)}
    >
      {children}
    </div>
  );
};

export default ReactMarkdown;
