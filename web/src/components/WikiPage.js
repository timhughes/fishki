import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Paper, Typography, Alert, LinearProgress, Button } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark, materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@mui/material/styles';

function CodeBlock({ node, inline, className, children, ...props }) {
  const theme = useTheme();
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';

  return !inline && match ? (
    <SyntaxHighlighter
      style={theme.palette.mode === 'dark' ? materialDark : materialLight}
      language={language}
      PreTag="div"
      children={String(children).replace(/\n$/, '')}
      {...props}
    />
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

function WikiPage() {
  const { filename } = useParams();
  const actualFilename = (filename || 'index') + '.md';
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

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
      .then((text) => {
        setContent(text);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setContent('');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filename]);

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
              onClick={() => {
                fetch('/api/save', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    filename: actualFilename,
                    content: '# ' + (filename || 'index'),
                  }),
                })
                .then(response => {
                  if (!response.ok) throw new Error('Failed to create page');
                  window.location.reload();
                })
                .catch(err => setError(err.message));
              }}
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
          <ReactMarkdown
            components={{
              code: CodeBlock,
            }}
          >
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
}

export default WikiPage;
