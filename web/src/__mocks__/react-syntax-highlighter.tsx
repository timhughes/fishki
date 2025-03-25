import React from 'react';

interface SyntaxHighlighterProps {
  children: string;
  language?: string;
  style?: Record<string, unknown>;
}

export const Prism: React.FC<SyntaxHighlighterProps> = ({ children }) => {
  return <pre data-testid="syntax-highlighter">{children}</pre>;
};

export default { Prism };
