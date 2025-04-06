import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, CircularProgress, Alert } from '@mui/material';
import { Folder as FolderIcon, InsertDriveFile as FileIcon } from '@mui/icons-material';
import { FileInfo } from '../types/api';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface PageBrowserProps {
  onFileSelect: (path: string) => void;
  selectedFile?: string;
  refreshTrigger?: number;  // Changes to this prop will trigger a refresh
}

// Helper function to remove .md extension
const removeMdExtension = (path: string): string => {
  if (!path) return path;
  return path.replace(/\.md$/, '');
};

// Check if a file is an index file
const isIndexFile = (name: string): boolean => {
  return name === 'index.md';
};

export const PageBrowser: React.FC<PageBrowserProps> = ({ onFileSelect, selectedFile, refreshTrigger }) => {
  const navigate = useNavigate();
  const [files, setFiles] = React.useState<FileInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();

  const loadFiles = React.useCallback(async () => {
    try {
      setLoading(true);
      const fileTree = await api.getFiles();
      setFiles(fileTree);
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadFiles();
  }, [loadFiles, refreshTrigger]);  // Refresh when trigger changes

  const renderFileTree = (items: FileInfo[], level = 0) => {
    return items
      .filter(item => {
        // Filter out index.md files from the tree view
        return !(item.type === 'file' && isIndexFile(item.name));
      })
      .map((item) => {
        const cleanPath = removeMdExtension(item.path);
        const cleanSelected = removeMdExtension(selectedFile || '');

        return (
          <Box key={item.path} sx={{ ml: level * 2 }}>
            <ListItem
              disablePadding
              sx={{
                '& .MuiListItemButton-root': {
                  borderRadius: 1,
                  mb: 0.5,
                },
              }}
            >
              <ListItemButton
                selected={cleanSelected === cleanPath}
                onClick={() => {
                  if (item.type === 'file') {
                    onFileSelect(item.path);
                  } else if (item.type === 'folder') {
                    // When clicking on a folder, navigate to its path with trailing slash
                    // This will trigger the folder handling logic in ViewPage
                    const folderPath = `${item.path}/`;
                    navigate(`/page/${folderPath}`);
                  }
                }}
                dense
                className={`file-item ${cleanSelected === cleanPath ? 'selected' : ''}`}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {item.type === 'folder' ? (
                    <FolderIcon color="action" fontSize="small" />
                  ) : (
                    <FileIcon color="action" fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.type === 'folder' ? item.name : removeMdExtension(item.name)}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: {
                      fontWeight: cleanSelected === cleanPath ? 500 : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
            {item.children && (
              <List disablePadding>
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
      <List dense disablePadding sx={{ py: 1 }}>
        {renderFileTree(files)}
      </List>
    </Box>
  );
};
