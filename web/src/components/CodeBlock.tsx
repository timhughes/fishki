import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark, materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@mui/material/styles';
import { CodeComponent } from 'react-markdown/lib/complex-types';

const CodeBlock: React.FC<CodeComponent> = ({ inline, className, children }) => {
  const theme = useTheme();
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';

  if (!inline && match) {
    const content = String(children).replace(/\n$/, '');
    return (
      <SyntaxHighlighter
        style={theme.palette.mode === 'dark' ? materialDark : materialLight}
        language={language}
        PreTag="div"
      >
        {content}
      </SyntaxHighlighter>
    );
  }

  return (
    <code className={className}>
      {children}
    </code>
  );
};

export default CodeBlock;
