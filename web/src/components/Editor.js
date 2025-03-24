import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Paper, 
  TextField, 
  Button, 
  Box, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Grid,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PreviewIcon from '@mui/icons-material/Visibility';
import SplitscreenIcon from '@mui/icons-material/Splitscreen';
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

function Editor() {
  const { filename = 'index.md' } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [viewMode, setViewMode] = useState('edit'); // 'edit', 'preview', or 'split'

  useEffect(() => {
    setLoading(true);
    fetch(`/api/load?filename=${filename}`)
      .then((response) => {
        if (!response.ok && response.status !== 404) {
          throw new Error('Failed to load page');
        }
        return response.text();
      })
      .then((text) => {
        setContent(text);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filename]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save the file
      const saveResponse = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save file');
      }

      // Commit the changes
      const commitResponse = await fetch('/api/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage || `Updated ${filename}` }),
      });

      if (!commitResponse.ok) {
        throw new Error('Failed to commit changes');
      }

      // Navigate back to view mode
      navigate(`/${filename === 'index.md' ? '' : filename}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setShowSaveDialog(false);
    }
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <LinearProgress />
      </Paper>
    );
  }

  const editorContent = (
    <TextField
      fullWidth
      multiline
      minRows={20}
      value={content}
      onChange={(e) => setContent(e.target.value)}
      variant="outlined"
      placeholder="Enter your markdown content here..."
    />
  );

  const previewContent = (
    <Paper sx={{ p: 2, minHeight: '500px' }}>
      <ReactMarkdown components={{ code: CodeBlock }}>
        {content}
      </ReactMarkdown>
    </Paper>
  );

  return (
    <>
      <Paper sx={{ p: 2, mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
          >
            <ToggleButton value="edit" aria-label="edit mode">
              <EditIcon sx={{ mr: 1 }} /> Edit
            </ToggleButton>
            <ToggleButton value="preview" aria-label="preview mode">
              <PreviewIcon sx={{ mr: 1 }} /> Preview
            </ToggleButton>
            <ToggleButton value="split" aria-label="split mode">
              <SplitscreenIcon sx={{ mr: 1 }} /> Split
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {viewMode === 'split' ? (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              {editorContent}
            </Grid>
            <Grid item xs={6}>
              {previewContent}
            </Grid>
          </Grid>
        ) : viewMode === 'preview' ? (
          previewContent
        ) : (
          editorContent
        )}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="contained"
            onClick={() => setShowSaveDialog(true)}
            disabled={saving}
          >
            Save
          </Button>
        </Box>
      </Paper>

      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>Save Changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter a commit message describing your changes:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Commit Message"
            fullWidth
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Editor;
