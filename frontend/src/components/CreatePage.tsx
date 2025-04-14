import React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { removeMdExtension } from '../utils/path';

interface CreatePageProps {
  path: string;
  onCreateClick: () => void;
}

export const CreatePage: React.FC<CreatePageProps> = ({ path, onCreateClick }) => {
  const displayPath = removeMdExtension(path);
  const pageName = displayPath.split('/').pop() || '';

  return (
    <Paper
      elevation={0}
      sx={{
        maxWidth: '800px',
        margin: '0 auto',
        p: 4,
        textAlign: 'center',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" color="text.primary" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {displayPath ? (
            <>The page "{pageName}" does not exist yet.</>
          ) : (
            <>Select a page from the tree or create a new one.</>
          )}
        </Typography>
      </Box>

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={onCreateClick}
      >
        {displayPath ? `Create "${pageName}"` : 'Create Page'}
      </Button>
    </Paper>
  );
};
