import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, NavigateFunction } from 'react-router-dom';
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
  Grid,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PreviewIcon from '@mui/icons-material/Visibility';
import SplitscreenIcon from '@mui/icons-material/Splitscreen';
import MarkdownRenderer from './MarkdownRenderer';
import LoadingError from './LoadingError';
import useFileOperations from '../hooks/useFileOperations';

type ViewMode = 'edit' | 'preview' | 'split';

interface CommitData {
  message: string;
  filename: string;
  content: string;
}

const Editor: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  
  const filename = useMemo(() => {
    const pathParam = params.path || 'index';
    return `${pathParam}.md`;
  }, [params.path]);

  const { saveFile, loadFile, loading, error } = useFileOperations();
  const [content, setContent] = useState<string>('');
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('edit');

  // Load initial content
  React.useEffect(() => {
    const fetchContent = async () => {
      try {
        const fileContent = await loadFile(filename);
        if (fileContent) setContent(fileContent);
      } catch (err) {
        // Error is handled by useFileOperations
      }
    };
    
    fetchContent();
  }, [filename, loadFile]);

  const handleSave = useCallback(async (): Promise<void> => {
    setSaving(true);
    try {
      await saveFile(filename, content);
      window.dispatchEvent(new Event('wiki-save'));
      setShowSaveDialog(false);
      navigate(params.path === 'index' ? '/' : `/${params.path}`);
    } finally {
      setSaving(false);
    }
  }, [filename, content, navigate, params.path, saveFile]);

  const handleViewModeChange = useCallback((_: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  const handleCommitMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommitMessage(e.target.value);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setShowSaveDialog(false);
    setCommitMessage('');
  }, []);

  const editorContent = useMemo(() => (
    <TextField
      fullWidth
      multiline
      minRows={20}
      value={content}
      onChange={handleContentChange}
      variant="outlined"
      placeholder="Enter your markdown content here..."
    />
  ), [content, handleContentChange]);

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

        <LoadingError loading={loading} error={error} />
        {!loading && !error && (
          <>
            {viewMode === 'split' ? (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  {editorContent}
                </Grid>
                <Grid item xs={6}>
                  <MarkdownRenderer content={content} />
                </Grid>
              </Grid>
            ) : viewMode === 'preview' ? (
              <MarkdownRenderer content={content} />
            ) : (
              editorContent
            )}
          </>
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

      <Dialog open={showSaveDialog} onClose={handleCloseDialog}>
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
            onChange={handleCommitMessageChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={saving || !commitMessage.trim()}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Editor;
