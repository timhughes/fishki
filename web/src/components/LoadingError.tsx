import React from 'react';
import { Paper, LinearProgress, Alert, Button } from '@mui/material';

interface LoadingErrorProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

const LoadingError: React.FC<LoadingErrorProps> = ({ loading, error, onRetry }) => {
  if (loading) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <LinearProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
        {onRetry && (
          <Button color="primary" size="small" onClick={onRetry}>
            Retry
          </Button>
        )}
      </Alert>
    );
  }

  return null;
};

export default LoadingError;
