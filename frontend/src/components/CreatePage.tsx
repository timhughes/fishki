import React from 'react';
import { Paper, Box, Typography, Button, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface CreatePageProps {
  path: string;
  onCreateClick: () => void;
}

export const CreatePage: React.FC<CreatePageProps> = ({ path, onCreateClick }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        maxWidth: '800px',
        margin: '0 auto',
        p: 3,
        bgcolor: 'background.paper',
      }}
    >
      <Alert 
        severity="info"
        sx={{ mb: 3 }}
        action={
          <Button
            color="primary"
            size="small"
            variant="contained"
            onClick={onCreateClick}
            startIcon={<AddIcon />}
          >
            Create Page
          </Button>
        }
      >
        <Typography variant="body1">
          The page "{path}" does not exist yet.
        </Typography>
      </Alert>
    </Paper>
  );
};
