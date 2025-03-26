import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Typography, Box, Button } from '@mui/material';
import MarkdownRenderer from './MarkdownRenderer';
import LoadingError from './LoadingError';
import useFetchContent from '../hooks/useFetchContent';
import useFileOperations from '../hooks/useFileOperations';

const WikiPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();

  const filename = useMemo(() => {
    const pagename = params['*'] || params['filename'] || 'index';
    return `${pagename}.md`;
  }, [params]);

  const pagename = useMemo(() => filename.replace('.md', ''), [filename]);
  
  const { content: fetchedContent, error: fetchError, loading } = useFetchContent(filename);
  const { saveFile } = useFileOperations();
  const [error, setError] = useState<string | null>(null);

  // Sync fetch errors to local error state
  React.useEffect(() => {
    setError(fetchError);
  }, [fetchError]);

  const handleCreatePage = useCallback(async (): Promise<void> => {
    try {
      await saveFile(filename, `# ${pagename}`);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page');
    }
  }, [filename, pagename, saveFile]);

  const handleEdit = useCallback(() => {
    navigate(pagename === 'index' ? '/edit' : `/${pagename}/edit`);
  }, [navigate, pagename]);

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <LoadingError loading={loading} error={error} />
      
      {!loading && !error && fetchedContent && (
        <>
          <div className="markdown-body">
            <MarkdownRenderer content={fetchedContent} />
          </div>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="contained" onClick={handleEdit}>
              Edit
            </Button>
          </Box>
        </>
      )}

      {!loading && !error && !fetchedContent && (
        <>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            This page doesn&apos;t exist yet. Would you like to create it?
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleCreatePage}>
              Create Page
            </Button>
            <Button variant="outlined" onClick={handleEdit}>
              Create and Edit
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default WikiPage;
