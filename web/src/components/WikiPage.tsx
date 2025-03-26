import React, { useState } from 'react';
import useFetchContent from '../hooks/useFetchContent';
import MarkdownRenderer from './MarkdownRenderer';
import LoadingError from './LoadingError';
import CodeBlock from './CodeBlock';
import { useParams } from 'react-router-dom';
import { Paper, Typography, Alert, LinearProgress, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark, materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@mui/material/styles';
import { Components } from 'react-markdown';
import { CodeProps } from 'react-markdown/lib/ast-to-react';


const WikiPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
<<<<<<< HEAD
  const pathParam = params.path || 'index';
  const pageName = pathParam;
  const actualFilename = pathParam;
  console.log('WikiPage path:', { pathParam, params }); // Debug log
  const fullFilename = actualFilename + '.md';
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
||||||| d0324ef
  const filename = params['*'] || params['filename'] || 'index';
  const actualFilename = filename + '.md';
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
=======
  const filename = params['*'] || params['filename'] || 'index';
  const actualFilename = filename + '.md';
  const { content, error: fetchError, loading } = useFetchContent(actualFilename);
  const [error, setError] = useState<string | null>(fetchError);
>>>>>>> f15e6e73e52322c069aa84ab83c490dfa27a4b34
  const [showCreate, setShowCreate] = useState<boolean>(false);

<<<<<<< HEAD
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

||||||| d0324ef
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

=======
>>>>>>> f15e6e73e52322c069aa84ab83c490dfa27a4b34
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
<<<<<<< HEAD
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
||||||| d0324ef
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
=======
    <Paper sx={{ p: 2, mt: 2 }}>
      <LoadingError loading={loading} error={error} />
>>>>>>> f15e6e73e52322c069aa84ab83c490dfa27a4b34
      {!loading && !error && content && (
<<<<<<< HEAD
        <div className="markdown-body" data-testid="markdown-container">
          <ReactMarkdown components={components}>
            {content}
          </ReactMarkdown>
||||||| d0324ef
        <div className="markdown-body">
          <ReactMarkdown components={components}>
            {content}
          </ReactMarkdown>
=======
        <div className="markdown-body">
          <MarkdownRenderer content={content} />
>>>>>>> f15e6e73e52322c069aa84ab83c490dfa27a4b34
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
