import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

interface UnsavedChangesDialogProps {
  open: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  open,
  onContinue,
  onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="unsaved-changes-dialog-title"
      aria-describedby="unsaved-changes-dialog-description"
    >
      <DialogTitle id="unsaved-changes-dialog-title">
        Unsaved Changes
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="unsaved-changes-dialog-description">
          You have unsaved changes that will be lost if you navigate away. 
          Do you want to discard your changes?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>
        <Button onClick={onContinue} color="error" variant="contained">
          Discard Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
