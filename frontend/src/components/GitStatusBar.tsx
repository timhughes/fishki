import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import GitBranchIcon from '@mui/icons-material/ForkRight';
import Typography from '@mui/material/Typography';
import { gitApi, RemoteStatus } from '../api/gitApi';
import { formatDistanceToNow } from 'date-fns';

interface GitStatusBarProps {
  refreshInterval?: number;
}

export const GitStatusBar: React.FC<GitStatusBarProps> = ({ 
  refreshInterval = 30000 // Default to 30 seconds
}) => {
  const [status, setStatus] = useState<RemoteStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch Git status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const newStatus = await gitApi.getStatus();
      setStatus(newStatus);
      
      // Auto-fetch if needed
      if (gitApi.shouldFetch() && !isFetching) {
        handleFetch(true); // Silent fetch
      }
    } catch (err) {
      console.error('Failed to fetch Git status:', err);
      setError('Failed to fetch Git status');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchStatus();
    
    // Set up periodic refresh
    const intervalId = setInterval(() => {
      fetchStatus();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  // Handle pull (rebase)
  const handlePull = async () => {
    if (isPulling) return;
    
    try {
      setIsPulling(true);
      setError(null);
      await gitApi.pull();
      await fetchStatus();
    } catch (err: any) {
      console.error('Failed to pull:', err);
      setError('Pull failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsPulling(false);
    }
  };

  // Handle push
  const handlePush = async () => {
    if (isPushing) return;
    
    try {
      setIsPushing(true);
      setError(null);
      await gitApi.push();
      await fetchStatus();
    } catch (err: any) {
      console.error('Failed to push:', err);
      setError('Push failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsPushing(false);
    }
  };

  // Handle fetch
  const handleFetch = async (silent = false) => {
    if (isFetching) return;
    
    try {
      setIsFetching(true);
      if (!silent) setError(null);
      await gitApi.fetch();
      await fetchStatus();
    } catch (err: any) {
      console.error('Failed to fetch:', err);
      if (!silent) {
        setError('Fetch failed: ' + (err?.message || 'Unknown error'));
      }
    } finally {
      setIsFetching(false);
    }
  };

  // If we're loading and don't have status yet, show loading
  if (loading && !status) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CircularProgress size={16} sx={{ mr: 1 }} />
        <Typography variant="caption" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // If we don't have status yet, show a minimal UI
  if (!status) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton 
          size="small" 
          onClick={() => handleFetch()}
          color="primary"
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" color="text.secondary">
          Git status unavailable
        </Typography>
      </Box>
    );
  }

  // Format last fetched time
  const lastFetchedText = status.lastFetched 
    ? `Last fetched ${formatDistanceToNow(status.lastFetched)} ago` 
    : 'Not fetched yet';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Branch name */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '2px 8px',
          mr: 1,
        }}
      >
        <GitBranchIcon 
          fontSize="small" 
          sx={{ 
            color: 'white', 
            opacity: 0.9,
            fontSize: '0.875rem',
            mr: 0.5
          }} 
        />
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'white',
            fontWeight: 500,
          }}
        >
          {status.branchName}
        </Typography>
      </Box>
      
      {/* Error indicator */}
      {error && (
        <Tooltip title={error}>
          <ErrorIcon color="error" fontSize="small" sx={{ mr: 1 }} />
        </Tooltip>
      )}
      
      {/* Git operations */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Fetch button */}
        <Tooltip title={lastFetchedText}>
          <IconButton 
            size="small" 
            onClick={() => handleFetch()}
            disabled={isFetching}
            color="inherit"
            sx={{ mx: 0.5 }}
          >
            {isFetching ? (
              <CircularProgress size={16} />
            ) : (
              <RefreshIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        
        {/* Pull button */}
        <Tooltip title={status.behindCount > 0 
          ? `Pull ${status.behindCount} commit${status.behindCount !== 1 ? 's' : ''} (rebase)` 
          : 'No changes to pull'
        }>
          <span> {/* Wrapper to allow tooltip on disabled button */}
            <IconButton 
              size="small" 
              onClick={handlePull}
              disabled={isPulling || status.behindCount === 0}
              color={status.behindCount > 0 ? "primary" : "inherit"}
              sx={{ 
                mx: 0.5,
                opacity: status.behindCount > 0 ? 1 : 0.5,
                '& .MuiSvgIcon-root': {
                  color: status.behindCount > 0 ? 'white' : 'inherit',
                },
                bgcolor: status.behindCount > 0 ? 'primary.main' : 'transparent',
                '&:hover': {
                  bgcolor: status.behindCount > 0 ? 'primary.dark' : undefined,
                }
              }}
            >
              {isPulling ? (
                <CircularProgress size={16} sx={{ color: 'white' }} />
              ) : (
                <Badge 
                  badgeContent={status.behindCount > 0 ? status.behindCount : null} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: 'error.main',
                      color: 'white',
                    }
                  }}
                >
                  <CloudDownloadIcon fontSize="small" />
                </Badge>
              )}
            </IconButton>
          </span>
        </Tooltip>
        
        {/* Push button */}
        <Tooltip title={status.aheadCount > 0 
          ? `Push ${status.aheadCount} commit${status.aheadCount !== 1 ? 's' : ''}` 
          : 'No changes to push'
        }>
          <span> {/* Wrapper to allow tooltip on disabled button */}
            <IconButton 
              size="small" 
              onClick={handlePush}
              disabled={isPushing || status.aheadCount === 0}
              color={status.aheadCount > 0 ? "primary" : "inherit"}
              sx={{ 
                mx: 0.5,
                opacity: status.aheadCount > 0 ? 1 : 0.5,
                '& .MuiSvgIcon-root': {
                  color: status.aheadCount > 0 ? 'white' : 'inherit',
                },
                bgcolor: status.aheadCount > 0 ? 'primary.main' : 'transparent',
                '&:hover': {
                  bgcolor: status.aheadCount > 0 ? 'primary.dark' : undefined,
                }
              }}
            >
              {isPushing ? (
                <CircularProgress size={16} sx={{ color: 'white' }} />
              ) : (
                <Badge 
                  badgeContent={status.aheadCount > 0 ? status.aheadCount : null} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: 'error.main',
                      color: 'white',
                    }
                  }}
                >
                  <CloudUploadIcon fontSize="small" />
                </Badge>
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      
      {/* Local changes indicator */}
      {(status.modifiedCount > 0 || status.untrackedCount > 0) && (
        <Typography 
          variant="caption" 
          color="warning.main" 
          sx={{ ml: 1 }}
        >
          {status.modifiedCount + status.untrackedCount} local changes
        </Typography>
      )}
    </Box>
  );
};
