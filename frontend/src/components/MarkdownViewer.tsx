import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoveIcon from '@mui/icons-material/DriveFileRenameOutline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { api } from '../api/client';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { MoveDialog } from './MoveDialog';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import 'highlight.js/styles/github.css';
import 'highlight.js/styles/github-dark.css';

interface MarkdownViewerProps {
  filePath: string;
  onEdit: () => void;
  onDelete: () => void;
  onRename: (oldPath: string, newPath: string) => void;
  onNotFound: () => React.ReactNode;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  filePath,
  onEdit,
  onDelete,
  onNotFound,
  onRename,
}) => {
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [notFound, setNotFound] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  
  // Get theme mode
  useTheme(); // Use theme context but don't need the mode directly
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [isDeleted, setIsDeleted] = useState(false);
  
  // Move dialog state
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState<string>();

  React.useEffect(() => {
    const loadContent = async () => {
      if (!filePath) return;
      
      try {
        setLoading(true);
        setError(undefined);
        setNotFound(false);
        setIsDeleted(false);
        const fileContent = await api.load(filePath);
        setContent(fileContent);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === '404') {
            setNotFound(true);
          } else {
            setError(err.message);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [filePath]);

  // Delete handlers
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
      setIsDeleted(true); // Mark the page as deleted
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
  
  // Move handlers
  const handleMoveClick = () => {
    setMoveDialogOpen(true);
    setMoveError(undefined);
  };
  
  const handleMoveConfirm = async (newPath: string) => {
    try {
      setMoving(true);
      setMoveError(undefined);
      
      // Don't do anything if the paths are the same
      if (newPath === filePath) {
        setMoveDialogOpen(false);
        setMoving(false);
        return;
      }
      
      await api.rename(filePath, newPath);
      setMoveDialogOpen(false);
      
      // Call the onRename callback if provided
      if (onRename) {
        onRename(filePath, newPath);
      }
      
      // Navigate to the new page
      const newUrl = newPath.replace(/\.md$/, '');
      navigate(`/page/${newUrl}`);
    } catch (err) {
      setMoveError(err instanceof Error ? err.message : 'Failed to move page');
      setMoving(false);
    }
  };
  
  const handleMoveCancel = () => {
    setMoveDialogOpen(false);
    setMoveError(undefined);
  };

  if (!filePath) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>No file selected</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
        <CircularProgress />
        <Typography>Loading content...</Typography>
      </Box>
    );
  }

  // Show the CreatePage interface if the page was deleted or not found
  if (isDeleted || notFound) {
    return onNotFound();
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error: {error}</Alert>
      </Box>
    );
  }

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          maxWidth: '1800px',
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
              variant="outlined"
              color="primary"
              onClick={handleMoveClick}
              startIcon={<MoveIcon />}
              size="small"
            >
              Move
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
          component="article"
          aria-label="markdown-content"
          className="markdown-content"
          sx={{
            '& img': {
              maxWidth: '100%',
              height: 'auto',
            },
            '& pre': {
              borderRadius: 1,
              overflow: 'auto',
              padding: '0.5rem',
              margin: '1rem 0',
              backgroundColor: '#f6f8fa',
            },
            '& code': {
              fontFamily: 'monospace',
              fontSize: '0.9rem',
            },
            '& pre > code': {
              padding: 0,
              background: 'none',
            },
            '& :not(pre) > code': {
              bgcolor: '#f6f8fa',
              px: 0.5,
              borderRadius: 0.5,
            },
            '& blockquote': {
              borderLeft: '4px solid',
              borderColor: 'grey.300',
              pl: 2,
              ml: 0,
              color: 'text.secondary',
            },
            '& table': {
              borderCollapse: 'collapse',
              width: '100%',
              '& th, & td': {
                border: '1px solid',
                borderColor: 'grey.300',
                p: 1,
              },
              '& th': {
                bgcolor: 'grey.50',
              },
            },
            '& h1, & h2': {
              borderBottom: '1px solid',
              borderColor: 'grey.200',
              pb: 1,
            },
            '& a': {
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            '& hr': {
              border: 'none',
              height: '1px',
              bgcolor: 'grey.200',
              my: 2,
            },
          }}
        >
          <Box className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize, [rehypeHighlight, { detect: true }]]}
            >
              {content}
            </ReactMarkdown>
          </Box>
        </Box>
      </Paper>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        pagePath={filePath}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        deleting={deleting}
        error={deleteError}
      />
      
      <MoveDialog
        open={moveDialogOpen}
        currentPath={filePath}
        onConfirm={handleMoveConfirm}
        onCancel={handleMoveCancel}
        moving={moving}
        error={moveError}
      />
    </>
  );
};
