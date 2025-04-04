import React from 'react';
import { Box, Paper, Button, CircularProgress, Alert, Typography } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { api } from '../api/client';

interface MarkdownViewerProps {
  filePath: string;
  onEdit: () => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ filePath, onEdit }) => {
  const [_, setContent] = React.useState<string>('');
  const [renderedContent, setRenderedContent] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const fileContent = await api.load(filePath);
        setContent(fileContent);
        const rendered = await api.render(fileContent);
        setRenderedContent(rendered);
        setError(undefined);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    if (filePath) {
      loadContent();
    }
  }, [filePath]);

  if (!filePath) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No file selected
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        maxWidth: '800px',
        margin: '0 auto',
        p: 3,
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 2,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={onEdit}
          startIcon={<EditIcon />}
          size="small"
        >
          Edit
        </Button>
      </Box>
      <Box
        className="markdown-content"
        sx={{
          '& img': {
            maxWidth: '100%',
            height: 'auto',
          },
          '& pre': {
            bgcolor: 'grey.100',
            borderRadius: 1,
            overflow: 'auto',
          },
          '& code': {
            bgcolor: 'grey.100',
            px: 0.5,
            borderRadius: 0.5,
            fontFamily: 'monospace',
          },
          '& blockquote': {
            borderLeft: 4,
            borderColor: 'grey.300',
            pl: 2,
            ml: 0,
            color: 'text.secondary',
          },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            '& th, & td': {
              border: 1,
              borderColor: 'grey.300',
              p: 1,
            },
            '& th': {
              bgcolor: 'grey.50',
            },
          },
        }}
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    </Paper>
  );
};
