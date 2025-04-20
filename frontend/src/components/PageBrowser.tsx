import React, { useEffect, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { FileInfo } from '../types/api';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import logger from '../utils/logger';

interface PageBrowserProps {
  onFileSelect: (path: string) => void;
  selectedFile?: string;
  refreshTrigger?: number;  // Changes to this prop will trigger a refresh
  onCreatePage?: (path: string) => void;  // Callback for creating a new page
  hasUnsavedChanges?: boolean; // Flag to indicate if there are unsaved changes
}

// Helper function to remove .md extension
const removeMdExtension = (path: string): string => {
  if (!path) return path;
  return path.replace(/\.md$/, '');
};

export const PageBrowser: React.FC<PageBrowserProps> = ({ 
  onFileSelect, 
  selectedFile, 
  refreshTrigger, 
  onCreatePage,
  hasUnsavedChanges = false
}) => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  
  // State to track expanded folders
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Load expanded folders state from localStorage on component mount
  useEffect(() => {
    try {
      const savedExpandedFolders = localStorage.getItem('fishki-expanded-folders');
      if (savedExpandedFolders) {
        setExpandedFolders(JSON.parse(savedExpandedFolders));
      }
    } catch (err) {
      // Failed to load expanded folders state, use default
      logger.warn('Failed to load expanded folders state', err, 'PageBrowser');
    }
  }, []);

  // Save expanded folders state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('fishki-expanded-folders', JSON.stringify(expandedFolders));
    } catch (err) {
      // Failed to save expanded folders state
      logger.warn('Failed to save expanded folders state', err, 'PageBrowser');
    }
  }, [expandedFolders]);

  // Toggle folder expanded/collapsed state
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: prev[path] === undefined ? false : !prev[path]
    }));
  };

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if wiki path is set first
      try {
        const config = await api.getConfig();
        if (!config.wikiPath) {
          setError('Wiki path not set');
          setLoading(false);
          return;
        }
      } catch (err) {
        setError('Failed to load configuration');
        logger.error('Failed to load configuration', err, 'PageBrowser');
        setLoading(false);
        return;
      }
      
      const fileTree = await api.getFiles();
      setFiles(fileTree);
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
      logger.error('Failed to load files', err, 'PageBrowser');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles, refreshTrigger]);  // Refresh when trigger changes

  const renderFileTree = (items: FileInfo[], level = 0) => {
    return items
      .map((item) => {
        const cleanPath = removeMdExtension(item.path);
        const cleanSelected = removeMdExtension(selectedFile || '');
        
        // Special handling for the root node
        const isRootNode = level === 0 && item.path === '';
        const isFolder = item.type === 'folder';
        const folderPath = item.path || 'root';
        // Default to expanded if not explicitly set to false
        const isFolderExpanded = expandedFolders[folderPath] !== false;

        return (
          <Box key={item.path || 'root'} sx={{ ml: level * 1.5 }}>
            <ListItem
              disablePadding
              sx={{
                '& .MuiListItemButton-root': {
                  borderRadius: 1,
                  py: 0.2, // Slightly increased padding
                  mb: 0.2, // Slightly increased margin
                },
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <ListItemButton
                selected={!isRootNode && cleanSelected === cleanPath}
                onClick={() => {
                  // First handle folder expansion/collapse
                  if (isFolder) {
                    toggleFolder(folderPath);
                    return;
                  }
                  
                  // If there are unsaved changes, don't navigate away directly
                  if (hasUnsavedChanges) {
                    // Instead, let the App component handle this with the dialog
                    onFileSelect(item.path);
                    return;
                  }
                  
                  // Handle navigation for files and root
                  if (isRootNode) {
                    // For root node, navigate to the root index
                    navigate('/page/index');
                  } else if (item.type === 'file') {
                    onFileSelect(item.path);
                  }
                }}
                dense
                className={`file-item ${!isRootNode && cleanSelected === cleanPath ? 'selected' : ''}`}
                sx={{ flexGrow: 1, minHeight: '26px' }}
              >
                {isFolder && (
                  <ListItemIcon sx={{ minWidth: 18, mr: -0.5 }}>
                    {isFolderExpanded ? (
                      <ExpandMoreIcon fontSize="small" style={{ fontSize: '1rem' }} />
                    ) : (
                      <ChevronRightIcon fontSize="small" style={{ fontSize: '1rem' }} />
                    )}
                  </ListItemIcon>
                )}
                <ListItemIcon sx={{ minWidth: 26 }}>
                  {item.type === 'folder' ? (
                    isFolderExpanded ? (
                      <FolderOpenIcon color="action" fontSize="small" style={{ fontSize: '1rem' }} />
                    ) : (
                      <FolderIcon color="action" fontSize="small" style={{ fontSize: '1rem' }} />
                    )
                  ) : (
                    <FileIcon color="action" fontSize="small" style={{ fontSize: '1rem' }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.type === 'folder' ? item.name : removeMdExtension(item.name)}
                  primaryTypographyProps={{
                    variant: 'body2',
                    noWrap: true,
                    sx: {
                      fontWeight: (!isRootNode && cleanSelected === cleanPath) ? 500 : 400,
                      fontSize: '0.825rem',
                      lineHeight: 1.3,
                    },
                  }}
                />
              </ListItemButton>
              
              {/* Add button for creating new pages */}
              {item.type === 'folder' && onCreatePage && (
                <Tooltip title={`Create page in ${item.name || 'root'}`}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      const path = item.path ? `${item.path}/` : '';
                      onCreatePage(path);
                    }}
                    sx={{ mr: 0.5, p: 0.4 }}
                  >
                    <AddIcon fontSize="small" style={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Tooltip>
              )}
            </ListItem>
            {item.children && isFolderExpanded && (
              <List disablePadding dense>
                {renderFileTree(item.children, level + 1)}
              </List>
            )}
          </Box>
        );
      });
  };

  if (loading && files.length === 0) {  // Show loading only on initial load
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress />
        <ListItemText primary="Loading files..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <List dense disablePadding sx={{ py: 0.3 }}>
        {renderFileTree(files)}
      </List>
    </Box>
  );
};
