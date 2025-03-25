import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Paper, Typography, Alert, LinearProgress, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const params = useParams();
  const pathParam = params.path || 'index';
  const pageName = pathParam;
  const actualFilename = pathParam;
  console.log('WikiPage path:', { pathParam, params }); // Debug log
  const fullFilename = actualFilename + '.md';
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreate, setShowCreate] = useState<boolean>(false);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        console.log('Loading:', fullFilename); // Debug log
        const response = await fetch(`/api/load?filename=${encodeURIComponent(fullFilename)}`);
        
        if (response.status === 404) {
          setShowCreate(true);
          throw new Error('This page does not exist.');
        }
        
        if (!response.ok) {
          throw new Error('Failed to load page');
        }

        const text = await response.text();
        setContent(text);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setContent('');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [fullFilename]);

  const handleCreatePage = async (): Promise<void> => {
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: fullFilename,
          content: `# ${pageName}`,
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
    <>
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
        <div className="markdown-body" data-testid="markdown-container">
          <ReactMarkdown components={components}>
            {content}
          </ReactMarkdown>
        </div>
      )}
      {!loading && !error && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={() => navigate(pathParam === 'index' ? '/edit' : `/${pathParam}/edit`)}
          >
            Edit
          </Button>
        </Box>
      )}
      {!loading && !error && !content && (
        <Typography variant="body1" color="text.secondary">
          This page is empty. Click Edit to add content.
        </Typography>
      )}
      </Paper>
    </>
  );
};

export default WikiPage;
