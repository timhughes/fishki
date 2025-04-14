import React from 'react';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import ButtonGroup from '@mui/material/ButtonGroup';
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

interface MarkdownToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onHeading: () => void;
  onCode: () => void;
  onCodeBlock: () => void;
  onLink: () => void;
  onImage: () => void;
  onBulletList: () => void;
  onNumberedList: () => void;
  onQuote: () => void;
  onHorizontalRule: () => void;
  onTaskList: () => void;
  onTable: () => void;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  onBold,
  onItalic,
  onHeading,
  onCode,
  onCodeBlock,
  onLink,
  onImage,
  onBulletList,
  onNumberedList,
  onQuote,
  onHorizontalRule,
  onTaskList,
  onTable,
}) => {
  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        mb: 2, 
        p: 1, 
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        alignItems: 'center'
      }}
    >
      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Bold (Ctrl+B)">
          <IconButton onClick={onBold} size="small">
            <BoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic (Ctrl+I)">
          <IconButton onClick={onItalic} size="small">
            <ItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Heading">
          <IconButton onClick={onHeading} size="small">
            <HeadingIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Bullet List">
          <IconButton onClick={onBulletList} size="small">
            <ListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Numbered List">
          <IconButton onClick={onNumberedList} size="small">
            <NumberedListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Task List">
          <IconButton onClick={onTaskList} size="small">
            <TaskListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Inline Code">
          <IconButton onClick={onCode} size="small">
            <CodeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Code Block">
          <IconButton onClick={onCodeBlock} size="small">
            <CodeIcon fontSize="small" sx={{ transform: 'scale(1.2)' }} />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Link">
          <IconButton onClick={onLink} size="small">
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Image">
          <IconButton onClick={onImage} size="small">
            <ImageIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Blockquote">
          <IconButton onClick={onQuote} size="small">
            <QuoteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Table">
          <IconButton onClick={onTable} size="small">
            <TableIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Horizontal Rule">
          <IconButton onClick={onHorizontalRule} size="small">
            <HorizontalRuleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </Paper>
  );
};
