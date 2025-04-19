import React, { useState, useEffect } from 'react';
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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import MoveIcon from '@mui/icons-material/DriveFileMove';
import { SelectChangeEvent } from '@mui/material/Select';
import { useFolders } from '../hooks/useFolders';

interface MoveDialogProps {
  open: boolean;
  currentPath: string;
  onConfirm: (newPath: string) => Promise<void>;
  onCancel: () => void;
  moving?: boolean;
  error?: string;
}

export const MoveDialog: React.FC<MoveDialogProps> = ({
  open,
  currentPath,
  onConfirm,
  onCancel,
  moving = false,
  error,
}) => {
  // Extract the filename and directory from the current path
  const pathParts = currentPath.split('/');
  const currentFilename = pathParts.pop() || '';
  const currentDirectory = pathParts.join('/');
  
  // Remove .md extension if present
  const displayName = currentFilename.replace(/\.md$/, '');
  
  const [newName, setNewName] = useState(displayName);
  const [targetDirectory, setTargetDirectory] = useState(currentDirectory);
  const [validationError, setValidationError] = useState('');
  
  // Use custom hook to fetch folders
  const { folders, loading: loadingFolders, error: folderError } = useFolders(open);

  // Reset the form when the dialog opens
  useEffect(() => {
    if (open) {
      setNewName(displayName);
      setTargetDirectory(currentDirectory);
      setValidationError('');
    }
  }, [open, displayName, currentDirectory]);

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

  const handleDirectoryChange = (e: SelectChangeEvent<string>) => {
    setTargetDirectory(e.target.value);
  };

  const handleConfirm = async () => {
    if (validationError) return;
    
    // Construct the new path
    const newPath = targetDirectory 
      ? `${targetDirectory}/${newName}.md` 
      : `${newName}.md`;
    
    // Check if the path is the same as the current path
    if (newPath === currentPath) {
      setValidationError('New path is the same as the current path');
      return;
    }
    
    await onConfirm(newPath);
  };

  return (
    <Dialog
      open={open}
      onClose={!moving ? onCancel : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MoveIcon color="primary" />
        Move Page
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
            {currentPath.replace(/\.md$/, '')}
          </Typography>
          
          <FormControl fullWidth margin="dense" disabled={moving || loadingFolders}>
            <InputLabel id="target-directory-label">Target Directory</InputLabel>
            <Select
              labelId="target-directory-label"
              id="target-directory"
              value={targetDirectory}
              label="Target Directory"
              onChange={handleDirectoryChange}
            >
              {folders.map((folder) => (
                <MenuItem key={folder} value={folder}>
                  {folder ? `/${folder}` : '/ (root)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Divider sx={{ my: 2 }} />
          
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
            helperText={validationError || "Enter the new name for this page"}
            disabled={moving}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            New path will be: <code>{targetDirectory ? `/${targetDirectory}/` : '/'}{newName}</code>
          </Typography>
        </Box>
        
        {folderError && (
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            {folderError}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onCancel}
          disabled={moving}
          color="inherit"
          size="small"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={moving || !!validationError || loadingFolders}
          color="primary"
          variant="contained"
          startIcon={moving ? <CircularProgress size={16} /> : <MoveIcon />}
          size="small"
        >
          {moving ? 'Moving...' : 'Move'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
