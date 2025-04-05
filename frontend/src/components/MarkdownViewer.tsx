import React from 'react';
import { Box, Paper, Button, CircularProgress, Alert, Typography } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { api } from '../api/client';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface MarkdownViewerProps {
  filePath: string;
  onEdit: () => void;
  onDelete: () => void;
  onNotFound: () => React.ReactNode;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  filePath,
  onEdit,
  onDelete,
  onNotFound,
}) => {
  const [content, setContent] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [notFound, setNotFound] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string>();

  React.useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const fileContent = await api.load(filePath);
        const rendered = await api.render(fileContent);
        setContent(rendered);
        setError(undefined);
      } catch (err) {
        if (err instanceof Error && err.message.includes('404')) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load content');
        }
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [filePath]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setDeleteError(undefined);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      setDeleteError(undefined);
      await api.delete(filePath);
      setDeleteDialogOpen(false);
      onDelete();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete page');
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteError(undefined);
  };

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

  if (notFound) {
    return <>{onNotFound()}</>;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <>
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
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            {filePath.split('/').pop()?.replace(/\.md$/, '')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteClick}
              startIcon={<DeleteIcon />}
              size="small"
            >
              Delete
            </Button>
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
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </Paper>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        pagePath={filePath}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        deleting={deleting}
        error={deleteError}
      />
    </>
  );
};
