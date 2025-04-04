import React from 'react';
import {
  Box,
  Paper,
  Button,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { api } from '../api/client';

interface MarkdownEditorProps {
  filePath: string;
  initialContent: string;
  onSave: () => void;
  onCancel: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  filePath,
  initialContent,
  onSave,
  onCancel,
}) => {
  const [content, setContent] = React.useState(initialContent);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [renderedContent, setRenderedContent] = React.useState('');

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.save(filePath, content);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    const renderPreview = async () => {
      try {
        const rendered = await api.render(content);
        setRenderedContent(rendered);
      } catch (err) {
        console.error('Failed to render preview:', err);
      }
    };
    renderPreview();
  }, [content]);

  return (
    <Paper
      elevation={0}
      sx={{
        maxWidth: '100%',
        margin: '0 auto',
        p: 3,
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
          mb: 2,
        }}
      >
        <Button
          variant="outlined"
          color="secondary"
          onClick={onCancel}
          disabled={saving}
          startIcon={<CancelIcon />}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => setError(undefined)}>
            {error}
          </Alert>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <TextField
            multiline
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={saving}
            variant="outlined"
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: 1.5,
                height: '500px',
                '& textarea': {
                  height: '100% !important',
                },
              },
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Paper
            variant="outlined"
            className="markdown-content"
            sx={{
              height: '500px',
              p: 2,
              overflowY: 'auto',
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
        </Box>
      </Box>
    </Paper>
  );
};
