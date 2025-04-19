import React, { useRef, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import EditIcon from '@mui/icons-material/Edit';
import PreviewIcon from '@mui/icons-material/Visibility';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import DragHandleIcon from '@mui/icons-material/DragHandle';
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
import { CustomTextArea } from './CustomTextArea';

// Define view mode type
type ViewMode = 'split' | 'edit' | 'preview';

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
  
  // Track the current view mode
  const [viewMode, setViewMode] = React.useState<ViewMode>('split');
  
  // Track the split position
  const [splitPosition, setSplitPosition] = useState(() => {
    // Try to get saved position from localStorage
    const savedPosition = localStorage.getItem('fishki-split-position');
    return savedPosition ? parseInt(savedPosition, 10) : 50; // Default to 50%
  });
  
  // Refs for drag handling
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use our navigation protection hooks
  const { setBlockNavigation, setHasUnsavedChanges } = useNavigation();

  // Use our markdown editor hook
  const {
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
    setHasUnsavedChanges(contentChanged);
  }, [content, initialContent, setBlockNavigation, setHasUnsavedChanges]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.save(filePath, content);
      setHasChanges(false);
      setBlockNavigation(false);
      setHasUnsavedChanges(false);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSaving(false); // Always reset saving state
    }
  };

  const handleCancel = () => {
    setBlockNavigation(false);
    setHasUnsavedChanges(false);
    onCancel();
  };

  // Add drag handling functions
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    // Add a class to the body to change cursor during dragging
    document.body.classList.add('resizing');
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // Calculate position as percentage of container width
    let newPosition = (mouseX / containerWidth) * 100;
    
    // Constrain to reasonable limits (10% to 90%)
    newPosition = Math.max(10, Math.min(90, newPosition));
    
    setSplitPosition(newPosition);
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.body.classList.remove('resizing');
    
    // Save position to localStorage
    localStorage.setItem('fishki-split-position', splitPosition.toString());
  };

  // Add effect to save split position when it changes
  useEffect(() => {
    if (viewMode === 'split') {
      localStorage.setItem('fishki-split-position', splitPosition.toString());
    }
  }, [splitPosition, viewMode]);
  
  // Add protection when component unmounts
  React.useEffect(() => {
    return () => {
      // If we still have changes when unmounting, make sure we're still protected
      if (hasChanges) {
        setBlockNavigation(true);
        setHasUnsavedChanges(true);
      }
    };
  }, [hasChanges, setBlockNavigation, setHasUnsavedChanges]);

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

      {/* View Mode Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && setViewMode(newMode)}
          aria-label="view mode"
          size="small"
        >
          <ToggleButton value="edit" aria-label="edit mode">
            <EditIcon fontSize="small" />
            <Box component="span" sx={{ ml: 0.5, display: { xs: 'none', sm: 'inline' } }}>Edit</Box>
          </ToggleButton>
          <ToggleButton value="split" aria-label="split mode">
            <ViewColumnIcon fontSize="small" />
            <Box component="span" sx={{ ml: 0.5, display: { xs: 'none', sm: 'inline' } }}>Split</Box>
          </ToggleButton>
          <ToggleButton value="preview" aria-label="preview mode">
            <PreviewIcon fontSize="small" />
            <Box component="span" sx={{ ml: 0.5, display: { xs: 'none', sm: 'inline' } }}>Preview</Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Formatting Toolbar */}
      <MarkdownToolbar 
        onBold={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) formatBold(textarea as HTMLTextAreaElement);
        }}
        onItalic={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) formatItalic(textarea as HTMLTextAreaElement);
        }}
        onHeading={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) formatHeading(textarea as HTMLTextAreaElement, 2);
        }}
        onCode={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) formatCode(textarea as HTMLTextAreaElement);
        }}
        onCodeBlock={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) formatCodeBlock(textarea as HTMLTextAreaElement);
        }}
        onLink={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) formatLink(textarea as HTMLTextAreaElement);
        }}
        onImage={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) formatImage(textarea as HTMLTextAreaElement);
        }}
        onBulletList={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) formatBulletList(textarea as HTMLTextAreaElement);
        }}
        onNumberedList={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) formatNumberedList(textarea as HTMLTextAreaElement);
        }}
        onQuote={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) formatQuote(textarea as HTMLTextAreaElement);
        }}
        onHorizontalRule={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) formatHorizontalRule(textarea as HTMLTextAreaElement);
        }}
        onTaskList={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) formatTaskList(textarea as HTMLTextAreaElement);
        }}
        onTable={() => {
          const textarea = document.querySelector('textarea');
          if (textarea) formatTable(textarea as HTMLTextAreaElement);
        }}
        sx={{ display: viewMode === 'preview' ? 'none' : 'flex' }}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: viewMode === 'split' ? 'row' : 'column',
          gap: viewMode === 'split' ? 0 : 2,
          position: 'relative',
          width: '100%',
          overflow: 'hidden', // Prevent container overflow
          height: 'calc(100vh - 200px)', // Dynamic height based on viewport
          minHeight: '400px', // Minimum height
        }}
        ref={containerRef}
      >
        {/* Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <Box sx={{ 
            flex: viewMode === 'split' ? `0 0 ${splitPosition}%` : '100%',
            transition: viewMode === 'split' ? 'none' : 'flex 0.3s ease',
            minWidth: 0, // Allow box to shrink below content size
            overflow: 'hidden', // Prevent overflow from child elements
            height: '100%', // Take full height of parent
            display: 'flex', // Use flexbox for full height child
            flexDirection: 'column', // Stack children vertically
          }}>
            <CustomTextArea
              value={content}
              onChange={(newContent) => setContent(newContent)}
              onKeyDown={handleKeyDown}
              disabled={saving}
            />
          </Box>
        )}
        
        {/* Resizer handle */}
        {viewMode === 'split' && (
          <Box
            sx={{
              width: '10px',
              cursor: 'col-resize',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%', // Take full height
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
              },
              zIndex: 1,
            }}
            onMouseDown={handleDragStart}
          >
            <DragHandleIcon 
              sx={{ 
                transform: 'rotate(90deg)',
                fontSize: '1rem',
                color: 'text.secondary'
              }} 
            />
          </Box>
        )}
        
        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <Box sx={{ 
            flex: viewMode === 'split' ? `0 0 ${100 - splitPosition - 1}%` : '100%',
            transition: viewMode === 'split' ? 'none' : 'flex 0.3s ease',
            minWidth: 0, // Allow box to shrink below content size
            overflow: 'hidden', // Prevent overflow from child elements
            height: '100%', // Take full height of parent
          }}>
            <Paper
              variant="outlined"
              className="markdown-content"
              data-testid="markdown-preview"
              sx={{
                height: '100%', // Take full height
                p: 2,
                overflowY: 'auto', // Enable vertical scrolling
                overflowX: 'auto', // Enable horizontal scrolling
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
        )}
      </Box>
    </Paper>
  );
};
