import React from 'react';
import Box from '@mui/material/Box';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Divider from '@mui/material/Divider';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import TitleIcon from '@mui/icons-material/Title';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

export type ToolbarAction = 
  | 'bold' 
  | 'italic' 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'ul' 
  | 'ol' 
  | 'code' 
  | 'codeblock' 
  | 'link' 
  | 'image' 
  | 'table' 
  | 'quote' 
  | 'hr' 
  | 'checkbox';

interface MarkdownToolbarProps {
  onAction: (action: ToolbarAction) => void;
  viewMode: string;
  onViewModeChange: (mode: string) => void;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ 
  onAction,
  viewMode,
  onViewModeChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: string | null,
  ) => {
    if (newMode !== null) {
      onViewModeChange(newMode);
    }
  };
  
  // Group 1: Basic formatting
  const basicFormatting = (
    <>
      <Tooltip title="Bold">
        <ToggleButton value="bold" aria-label="bold" onClick={() => onAction('bold')}>
          <FormatBoldIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Italic">
        <ToggleButton value="italic" aria-label="italic" onClick={() => onAction('italic')}>
          <FormatItalicIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
    </>
  );
  
  // Group 2: Headings
  const headings = (
    <>
      <Tooltip title="Heading 1">
        <ToggleButton value="h1" aria-label="heading 1" onClick={() => onAction('h1')}>
          <TitleIcon fontSize="small" />1
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Heading 2">
        <ToggleButton value="h2" aria-label="heading 2" onClick={() => onAction('h2')}>
          <TitleIcon fontSize="small" />2
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Heading 3">
        <ToggleButton value="h3" aria-label="heading 3" onClick={() => onAction('h3')}>
          <TitleIcon fontSize="small" />3
        </ToggleButton>
      </Tooltip>
    </>
  );
  
  // Group 3: Lists
  const lists = (
    <>
      <Tooltip title="Bullet List">
        <ToggleButton value="ul" aria-label="bullet list" onClick={() => onAction('ul')}>
          <FormatListBulletedIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Numbered List">
        <ToggleButton value="ol" aria-label="numbered list" onClick={() => onAction('ol')}>
          <FormatListNumberedIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Checkbox">
        <ToggleButton value="checkbox" aria-label="checkbox" onClick={() => onAction('checkbox')}>
          <CheckBoxIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
    </>
  );
  
  // Group 4: Code
  const code = (
    <>
      <Tooltip title="Inline Code">
        <ToggleButton value="code" aria-label="inline code" onClick={() => onAction('code')}>
          <CodeIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Code Block">
        <ToggleButton value="codeblock" aria-label="code block" onClick={() => onAction('codeblock')}>
          <CodeIcon fontSize="small" />{ isMobile ? '' : 'Block' }
        </ToggleButton>
      </Tooltip>
    </>
  );
  
  // Group 5: Media
  const media = (
    <>
      <Tooltip title="Link">
        <ToggleButton value="link" aria-label="link" onClick={() => onAction('link')}>
          <LinkIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Image">
        <ToggleButton value="image" aria-label="image" onClick={() => onAction('image')}>
          <ImageIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
    </>
  );
  
  // Group 6: Other
  const other = (
    <>
      <Tooltip title="Table">
        <ToggleButton value="table" aria-label="table" onClick={() => onAction('table')}>
          <TableChartIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Quote">
        <ToggleButton value="quote" aria-label="quote" onClick={() => onAction('quote')}>
          <FormatQuoteIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Horizontal Rule">
        <ToggleButton value="hr" aria-label="horizontal rule" onClick={() => onAction('hr')}>
          <HorizontalRuleIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
    </>
  );
  
  // View mode toggle
  const viewModeToggle = (
    <ToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={handleViewModeChange}
      aria-label="view mode"
      size="small"
    >
      <ToggleButton value="edit" aria-label="edit mode">
        <EditIcon fontSize="small" />
        {!isMobile && <Box component="span" sx={{ ml: 0.5 }}>Edit</Box>}
      </ToggleButton>
      <ToggleButton value="split" aria-label="split mode">
        <ViewQuiltIcon fontSize="small" />
        {!isMobile && <Box component="span" sx={{ ml: 0.5 }}>Split</Box>}
      </ToggleButton>
      <ToggleButton value="preview" aria-label="preview mode">
        <VisibilityIcon fontSize="small" />
        {!isMobile && <Box component="span" sx={{ ml: 0.5 }}>Preview</Box>}
      </ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1,
        mb: 1,
        overflowX: 'auto',
        '& .MuiToggleButtonGroup-root': {
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
        },
      }}
    >
      {/* Left side: Formatting tools */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1,
        flexWrap: 'wrap',
        '& .MuiToggleButtonGroup-root': {
          flexShrink: 0,
        },
      }}>
        <ToggleButtonGroup size="small">
          {basicFormatting}
        </ToggleButtonGroup>
        
        <ToggleButtonGroup size="small">
          {headings}
        </ToggleButtonGroup>
        
        <ToggleButtonGroup size="small">
          {lists}
        </ToggleButtonGroup>
        
        <ToggleButtonGroup size="small">
          {code}
        </ToggleButtonGroup>
        
        <ToggleButtonGroup size="small">
          {media}
        </ToggleButtonGroup>
        
        {!isMobile && (
          <ToggleButtonGroup size="small">
            {other}
          </ToggleButtonGroup>
        )}
      </Box>
      
      {/* Right side: View mode toggle */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: { xs: 'flex-start', sm: 'flex-end' },
        flexGrow: 1,
        mt: { xs: 1, sm: 0 },
      }}>
        {viewModeToggle}
      </Box>
    </Box>
  );
};
