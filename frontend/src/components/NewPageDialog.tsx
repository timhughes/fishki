import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

interface NewPageDialogProps {
  open: boolean;
  folderPath: string;
  onClose: () => void;
  onConfirm: (pageName: string, folderPath: string) => void;
}

export const NewPageDialog: React.FC<NewPageDialogProps> = ({
  open,
  folderPath,
  onClose,
  onConfirm,
}) => {
  // Generate a default page name using ISO8601 format
  const getDefaultPageName = () => {
    // Format: YYYY-MM-DDTHH-mm-ss (using hyphens instead of colons for filename compatibility)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}-${minutes}-${seconds}`;
  };

  const [pageName, setPageName] = useState(getDefaultPageName());
  const [error, setError] = useState('');

  // Reset the page name when the dialog opens
  useEffect(() => {
    if (open) {
      setPageName(getDefaultPageName());
      setError('');
    }
  }, [open]);

  const handleConfirm = () => {
    // Validate the page name
    if (!pageName.trim()) {
      setError('Page name cannot be empty');
      return;
    }

    // Check for invalid characters in the page name
    const invalidChars = /[\\/:*?"<>|]/;
    if (invalidChars.test(pageName)) {
      setError('Page name contains invalid characters');
      return;
    }

    onConfirm(pageName, folderPath);
  };

  const locationText = folderPath 
    ? `in folder "${folderPath.replace(/\/$/, '')}"` 
    : 'in the root directory';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Page</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Enter a name for the new page {locationText}.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Page Name"
          type="text"
          fullWidth
          variant="outlined"
          value={pageName}
          onChange={(e) => setPageName(e.target.value)}
          error={!!error}
          helperText={error}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleConfirm();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary" size="small">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};
