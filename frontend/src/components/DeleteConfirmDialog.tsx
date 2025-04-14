import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteIcon from '@mui/icons-material/Delete';

interface DeleteConfirmDialogProps {
  open: boolean;
  pagePath: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  deleting?: boolean;
  error?: string;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  pagePath,
  onConfirm,
  onCancel,
  deleting = false,
  error,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={!deleting ? onCancel : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DeleteIcon color="error" />
        Delete Page
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: error ? 2 : 0 }}>
          <Typography>
            Are you sure you want to delete the following page?
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              p: 1,
              bgcolor: 'grey.100',
              borderRadius: 1,
              fontFamily: 'monospace',
            }}
          >
            {pagePath}
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
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
          disabled={deleting}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={deleting}
          color="error"
          variant="contained"
          startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
