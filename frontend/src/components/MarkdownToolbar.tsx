import React from 'react';
import {
  Paper,
  IconButton,
  Tooltip,
  Divider,
  ButtonGroup,
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatListBulleted as ListIcon,
  FormatListNumbered as NumberedListIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Title as HeadingIcon,
  FormatQuote as QuoteIcon,
  TableChart as TableIcon,
  HorizontalRule as HorizontalRuleIcon,
  CheckBox as TaskListIcon,
} from '@mui/icons-material';

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
