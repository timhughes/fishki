import React, { useState } from 'react';
import useFetchContent from '../hooks/useFetchContent';
import MarkdownRenderer from './MarkdownRenderer';
import LoadingError from './LoadingError';
import CodeBlock from './CodeBlock';
import { useParams } from 'react-router-dom';
import { Paper, Typography, Alert, LinearProgress, Button } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark, materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@mui/material/styles';
import { Components } from 'react-markdown';
import { CodeProps } from 'react-markdown/lib/ast-to-react';


const WikiPage: React.FC = () => {
  const params = useParams();
  const filename = params['*'] || params['filename'] || 'index';
  const actualFilename = filename + '.md';
  const { content, error: fetchError, loading } = useFetchContent(actualFilename);
  const [error, setError] = useState<string | null>(fetchError);
  const [showCreate, setShowCreate] = useState<boolean>(false);

  const handleCreatePage = async (): Promise<void> => {
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: actualFilename,
          content: `# ${filename}`,
        }),
      });

      if (!response.ok) throw new Error('Failed to create page');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page');
    }
  };

  const components: Components = {
    code: CodeBlock
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <LoadingError loading={loading} error={error} />
      {!loading && !error && content && (
        <div className="markdown-body">
          <MarkdownRenderer content={content} />
        </div>
      )}
      {!loading && !error && !content && (
        <Typography variant="body1" color="text.secondary">
          This page is empty. Click Edit to add content.
        </Typography>
      )}
    </Paper>
  );
};

export default WikiPage;
