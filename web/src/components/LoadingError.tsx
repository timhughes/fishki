import React from 'react';
import { Paper, Alert, Button, Box } from '@mui/material';
import LoadingSpinner from './LoadingSpinner';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

interface LoadingErrorProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  loadingMessage?: string;
}

const LoadingError: React.FC<LoadingErrorProps> = ({
  loading,
  error,
  onRetry,
  loadingMessage
}) => {
  if (loading) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <LoadingSpinner message={loadingMessage} />
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error"
        icon={<ErrorIcon />}
        sx={{ 
          mt: 2,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1
        }}>
          <span>{error}</span>
          {onRetry && (
            <Button 
              variant="outlined" 
              color="error" 
              size="small" 
              onClick={onRetry}
              sx={{ minWidth: 100 }}
            >
              Try Again
            </Button>
          )}
        </Box>
      </Alert>
    );
  }

  return null;
};

export default LoadingError;
