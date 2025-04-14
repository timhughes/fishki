import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import RenameIcon from '@mui/icons-material/DriveFileRenameOutline';

interface RenameDialogProps {
  open: boolean;
  currentPath: string;
  onConfirm: (newPath: string) => Promise<void>;
  onCancel: () => void;
  renaming?: boolean;
  error?: string;
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  currentPath,
  onConfirm,
  onCancel,
  renaming = false,
  error,
}) => {
  // Extract the filename and directory from the current path
  const pathParts = currentPath.split('/');
  const currentFilename = pathParts.pop() || '';
  const directory = pathParts.join('/');
  
  // Remove .md extension if present
  const displayName = currentFilename.replace(/\.md$/, '');
  
  const [newName, setNewName] = useState(displayName);
  const [validationError, setValidationError] = useState('');

  // Reset the form when the dialog opens
  React.useEffect(() => {
    if (open) {
      setNewName(displayName);
      setValidationError('');
    }
  }, [open, displayName]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewName(value);
    
    // Basic validation
    if (!value.trim()) {
      setValidationError('Page name cannot be empty');
    } else if (value.includes('/') || value.includes('\\')) {
      setValidationError('Page name cannot contain slashes');
    } else {
      setValidationError('');
    }
  };

  const handleConfirm = async () => {
    if (validationError) return;
    
    // Construct the new path
    const newPath = directory 
      ? `${directory}/${newName}.md` 
      : `${newName}.md`;
    
    await onConfirm(newPath);
  };

  return (
    <Dialog
      open={open}
      onClose={!renaming ? onCancel : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RenameIcon color="primary" />
        Rename Page
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Current path:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              p: 1,
              bgcolor: 'grey.100',
              borderRadius: 1,
              fontFamily: 'monospace',
              mb: 3,
            }}
          >
            {currentPath}
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="New Page Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={handleNameChange}
            error={!!validationError}
            helperText={validationError || "Enter the new name for this page (without .md extension)"}
            disabled={renaming}
          />
          
          {directory && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              The page will remain in the same directory: <code>{directory}/</code>
            </Typography>
          )}
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onCancel}
          disabled={renaming}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={renaming || !!validationError}
          color="primary"
          variant="contained"
          startIcon={renaming ? <CircularProgress size={20} /> : <RenameIcon />}
        >
          {renaming ? 'Renaming...' : 'Rename'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
