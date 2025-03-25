import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Paper, Typography, Alert, LinearProgress, Button } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark, materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@mui/material/styles';
import { Components } from 'react-markdown';
import { CodeProps } from 'react-markdown/lib/ast-to-react';

const CodeBlock: React.FC<CodeProps> = ({ inline, className, children }) => {
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

const WikiPage: React.FC = () => {
  const params = useParams();
  const filename = params['*'] || params['filename'] || 'index';
  const actualFilename = filename + '.md';
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreate, setShowCreate] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/load?filename=${actualFilename}`)
      .then((response) => {
        if (!response.ok) {
          if (response.status === 404) {
            setShowCreate(true);
            throw new Error('This page does not exist.');
          }
          throw new Error('Failed to load page');
        }
        return response.text();
      })
      .then((text: string) => {
        setContent(text);
        setError(null);
      })
      .catch((err: Error) => {
        setError(err.message);
        setContent('');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filename, actualFilename]);

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
      {loading && <LinearProgress />}
      {error && showCreate && (
        <Alert 
          severity="info" 
          sx={{ mt: 2 }}
          action={
            <Button
              color="primary"
              size="small"
              onClick={handleCreatePage}
            >
              Create Page
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {error && !showCreate && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {!loading && !error && content && (
        <div className="markdown-body">
          <ReactMarkdown components={components}>
            {content}
          </ReactMarkdown>
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
