import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import IconButton from '@mui/material/IconButton';
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
import logger from '../utils/logger';
import { CustomTextArea } from './CustomTextArea';
import { FileBreadcrumbs } from './Breadcrumbs';

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
    // Default to 50% split
    return window.innerWidth > 768 ? 50 : 100;
  });
  
  // Get navigation context for unsaved changes protection
  const { setBlockNavigation, setHasUnsavedChanges } = useNavigation();
  
  // Set up editor with toolbar actions
  const { 
    textAreaRef,
    handleToolbarAction,
    handleKeyDown,
  } = useMarkdownEditor({
    content,
    setContent,
  });
  
  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Mark as changed if different from initial
    if (newContent !== initialContent && !hasChanges) {
      setHasChanges(true);
      setBlockNavigation(true);
      setHasUnsavedChanges(true);
    } else if (newContent === initialContent && hasChanges) {
      setHasChanges(false);
      setBlockNavigation(false);
      setHasUnsavedChanges(false);
    }
  };
  
  // Handle save action
  const handleSave = async () => {
    try {
      setSaving(true);
      logger.info(`Saving file: ${filePath}`, null, 'MarkdownEditor');
      setError(undefined);
      await api.save(filePath, content);
      setHasChanges(false);
      setBlockNavigation(false);
      setHasUnsavedChanges(false);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      logger.error('Failed to save file', { filename: filePath, error: err }, 'MarkdownEditor');
      setSaving(false);
    }
  };
  
  // Handle cancel action
  const handleCancel = () => {
    setHasChanges(false);
    setBlockNavigation(false);
    setHasUnsavedChanges(false);
    onCancel();
  };
  
  // Handle view mode changes
  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as ViewMode);
  };
  
  // Focus the editor on mount
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [textAreaRef]);
  
  // Calculate editor and preview widths based on view mode and split position
  const editorWidth = React.useMemo(() => {
    switch (viewMode) {
      case 'edit':
        return '100%';
      case 'preview':
        return '0%';
      case 'split':
      default:
        return `${splitPosition}%`;
    }
  }, [splitPosition, viewMode]);
  
  const previewWidth = React.useMemo(() => {
    switch (viewMode) {
      case 'edit':
        return '0%';
      case 'preview':
        return '100%';
      case 'split':
      default:
        return `${100 - splitPosition}%`;
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
        width: '100%', // Ensure it takes full width
        margin: '0 auto',
        p: 1, // Reduced padding
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 100px)', // Take most of the viewport height
      }}
    >
      {/* Compact Header Area */}
      <Box sx={{ flex: '0 0 auto' }}>
        {/* Compact header with breadcrumbs and buttons side by side */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 2,
            gap: 1,
            flex: '0 0 auto', // Don't grow or shrink
          }}
        >
          <FileBreadcrumbs filePath={filePath} />
          
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' },
            }}
          >
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
              disabled={saving}
              startIcon={<CancelIcon />}
              size="small"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              size="small"
            >
              Save
            </Button>
          </Box>
        </Box>
        
        {/* Status indicators */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {hasChanges && (
            <Alert severity="info" sx={{ py: 0, px: 1, height: '32px', '& .MuiAlert-message': { padding: '4px 0' } }}>
              Unsaved changes
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ py: 0, px: 1, height: '32px', '& .MuiAlert-message': { padding: '4px 0' } }}>
              {error}
              <IconButton 
                size="small" 
                aria-label="close" 
                color="inherit" 
                onClick={() => setError(undefined)}
                sx={{ p: 0, ml: 1 }}
              >
                ×
              </IconButton>
            </Alert>
          )}
        </Box>
        
        {/* Toolbar */}
        <MarkdownToolbar 
          onAction={handleToolbarAction} 
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      </Box>
      
      {/* Editor and Preview Area */}
      <Box
        sx={{
          display: 'flex',
          flex: '1 1 auto', // Take remaining space
          overflow: 'hidden', // Prevent overflow
          position: 'relative', // For absolute positioning of the drag handle
          mt: 1, // Add margin top
        }}
      >
        {/* Editor */}
        <Box
          sx={{
            width: editorWidth,
            display: viewMode === 'preview' ? 'none' : 'block',
            overflow: 'hidden',
            pr: viewMode === 'split' ? 1 : 0, // Add padding when in split mode
          }}
        >
          <CustomTextArea
            ref={textAreaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Write your markdown here..."
            sx={{
              width: '100%',
              height: '100%',
              resize: 'none',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              overflowY: 'auto',
            }}
          />
        </Box>
        
        {/* Drag handle for split view */}
        {viewMode === 'split' && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `calc(${splitPosition}% - 8px)`,
              width: '16px',
              cursor: 'col-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              transform: 'translateX(-4px)',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              
              const startX = e.clientX;
              const startPosition = splitPosition;
              const containerWidth = e.currentTarget.parentElement?.clientWidth || 0;
              
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaPercent = (deltaX / containerWidth) * 100;
                const newPosition = Math.max(20, Math.min(80, startPosition + deltaPercent));
                setSplitPosition(newPosition);
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <DragHandleIcon sx={{ transform: 'rotate(90deg)',color: 'text.secondary', fontSize: '1rem' }} />
          </Box>
        )}
        
        {/* Preview */}
        <Box
          sx={{
            width: previewWidth,
            display: viewMode === 'edit' ? 'none' : 'block',
            overflow: 'auto',
            pl: viewMode === 'split' ? 1 : 0, // Add padding when in split mode
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            '& img': {
              maxWidth: '100%',
              height: 'auto',
            },
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </Box>
      </Box>
    </Paper>
  );
};
