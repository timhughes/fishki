import React from 'react';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import ButtonGroup from '@mui/material/ButtonGroup';
import Box from '@mui/material/Box';
import BoldIcon from '@mui/icons-material/FormatBold';
import ItalicIcon from '@mui/icons-material/FormatItalic';
import ListIcon from '@mui/icons-material/FormatListBulleted';
import NumberedListIcon from '@mui/icons-material/FormatListNumbered';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import HeadingIcon from '@mui/icons-material/Title';
import QuoteIcon from '@mui/icons-material/FormatQuote';
import TableIcon from '@mui/icons-material/TableChart';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import TaskListIcon from '@mui/icons-material/CheckBox';
import EditIcon from '@mui/icons-material/Edit';
import PreviewIcon from '@mui/icons-material/Visibility';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { SxProps, Theme } from '@mui/material/styles';

interface MarkdownToolbarProps {
  onAction: (action: string) => void;
  viewMode?: string;
  onViewModeChange?: (mode: string) => void;
  sx?: SxProps<Theme>;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  onAction,
  viewMode = 'edit',
  onViewModeChange,
  sx = {},
}) => {
  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        mb: 1, // Reduced margin
        py: 0.5, // Reduced padding
        px: 1,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.5, // Reduced gap
        alignItems: 'center',
        width: '100%', // Ensure toolbar takes full width
        ...sx
      }}
    >
      {/* Left side: Formatting tools - only show in edit or split mode */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 0.5, 
        alignItems: 'center',
        visibility: viewMode === 'preview' ? 'hidden' : 'visible',
        flex: 1
      }}>
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Bold (Ctrl+B)">
            <IconButton onClick={() => onAction('bold')} size="small">
              <BoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic (Ctrl+I)">
            <IconButton onClick={() => onAction('italic')} size="small">
              <ItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Heading">
            <IconButton onClick={() => onAction('h2')} size="small">
              <HeadingIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Bullet List">
            <IconButton onClick={() => onAction('bulletlist')} size="small">
              <ListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbered List">
            <IconButton onClick={() => onAction('numberedlist')} size="small">
              <NumberedListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Task List">
            <IconButton onClick={() => onAction('tasklist')} size="small">
              <TaskListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Inline Code">
            <IconButton onClick={() => onAction('code')} size="small">
              <CodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Code Block">
            <IconButton onClick={() => onAction('codeblock')} size="small">
              <CodeIcon fontSize="small" sx={{ transform: 'scale(1.2)' }} />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Link">
            <IconButton onClick={() => onAction('link')} size="small">
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Image">
            <IconButton onClick={() => onAction('image')} size="small">
              <ImageIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Blockquote">
            <IconButton onClick={() => onAction('quote')} size="small">
              <QuoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Table">
            <IconButton onClick={() => onAction('table')} size="small">
              <TableIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Horizontal Rule">
            <IconButton onClick={() => onAction('hr')} size="small">
              <HorizontalRuleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Box>
      
      {/* Right side: View mode toggle - always show */}
      {onViewModeChange && (
        <>
          <Divider orientation="vertical" flexItem sx={{ visibility: viewMode === 'preview' ? 'hidden' : 'visible' }} />
          
          <ButtonGroup size="small" variant="outlined">
            <Tooltip title="Edit Mode">
              <IconButton 
                onClick={() => onViewModeChange('edit')} 
                size="small"
                color={viewMode === 'edit' ? 'primary' : 'default'}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Split Mode">
              <IconButton 
                onClick={() => onViewModeChange('split')} 
                size="small"
                color={viewMode === 'split' ? 'primary' : 'default'}
              >
                <ViewColumnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Preview Mode">
              <IconButton 
                onClick={() => onViewModeChange('preview')} 
                size="small"
                color={viewMode === 'preview' ? 'primary' : 'default'}
              >
                <PreviewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
        </>
      )}
    </Paper>
  );
};
