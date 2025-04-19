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
        {/* Combined top row with all controls */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1, // Reduced margin
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            gap: 1,
          }}
        >
          {/* Left side: View mode toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            aria-label="view mode"
            size="small"
            sx={{ flexShrink: 0 }}
          >
            <ToggleButton value="edit" aria-label="edit mode">
              <EditIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="split" aria-label="split mode">
              <ViewColumnIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="preview" aria-label="preview mode">
              <PreviewIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
          
          {/* Middle: Status indicators */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, justifyContent: 'center' }}>
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
          
          {/* Right side: Action buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
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
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>

        {/* Formatting Toolbar - more compact */}
        <Box sx={{ width: '100%' }}>
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
            sx={{ display: viewMode === 'preview' ? 'none' : 'flex', width: '100%' }}
          />
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: viewMode === 'split' ? 'row' : 'column',
          gap: viewMode === 'split' ? 0 : 2,
          position: 'relative',
          width: '100%',
          overflow: 'hidden', // Prevent container overflow
          flex: '1 1 auto', // Take remaining space
          minHeight: 0, // Allow box to shrink below content size
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
