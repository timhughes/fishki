import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { api } from '../api/client';
import { useNavigation } from '../contexts/NavigationContext';
import { MarkdownToolbar } from './MarkdownToolbar';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';

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
  
  // Track if content has been modified
  const [hasChanges, setHasChanges] = React.useState(false);
  
  // Use our navigation protection hooks
  const { setBlockNavigation } = useNavigation();

  // Use our markdown editor hook
  const {
    textFieldRef,
    formatBold,
    formatItalic,
    formatHeading,
    formatCode,
    formatCodeBlock,
    formatLink,
    formatImage,
    formatBulletList,
    formatNumberedList,
    formatQuote,
    formatHorizontalRule,
    formatTaskList,
    formatTable,
    handleKeyDown
  } = useMarkdownEditor({ content, setContent });

  // Update hasChanges when content changes
  React.useEffect(() => {
    const contentChanged = content !== initialContent;
    setHasChanges(contentChanged);
    setBlockNavigation(contentChanged);
  }, [content, initialContent, setBlockNavigation]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.save(filePath, content);
      setHasChanges(false);
      setBlockNavigation(false);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSaving(false); // Always reset saving state
    }
  };

  const handleCancel = () => {
    setBlockNavigation(false);
    onCancel();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    // The effect will handle updating hasChanges
  };

  // Add protection when component unmounts
  React.useEffect(() => {
    return () => {
      // If we still have changes when unmounting, make sure we're still protected
      if (hasChanges) {
        setBlockNavigation(true);
      }
    };
  }, [hasChanges, setBlockNavigation]);

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
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box>
          {hasChanges && (
            <Alert severity="info" sx={{ py: 0 }}>
              You have unsaved changes
            </Alert>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCancel}
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
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => setError(undefined)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Formatting Toolbar */}
      <MarkdownToolbar 
        onBold={formatBold}
        onItalic={formatItalic}
        onHeading={formatHeading}
        onCode={formatCode}
        onCodeBlock={formatCodeBlock}
        onLink={formatLink}
        onImage={formatImage}
        onBulletList={formatBulletList}
        onNumberedList={formatNumberedList}
        onQuote={formatQuote}
        onHorizontalRule={formatHorizontalRule}
        onTaskList={formatTaskList}
        onTable={formatTable}
      />

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
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            disabled={saving}
            variant="outlined"
            inputRef={textFieldRef}
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
            data-testid="markdown-preview"
            sx={{
              height: '500px',
              p: 2,
              overflowY: 'auto',
            }}
          >
            <Box className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
              >
                {content}
              </ReactMarkdown>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Paper>
  );
};
