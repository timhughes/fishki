import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, CircularProgress, Alert } from '@mui/material';
import { Folder as FolderIcon, InsertDriveFile as FileIcon } from '@mui/icons-material';
import { FileInfo } from '../types/api';
import { api } from '../api/client';

interface PageBrowserProps {
  onFileSelect: (path: string) => void;
  selectedFile?: string;
}

export const PageBrowser: React.FC<PageBrowserProps> = ({ onFileSelect, selectedFile }) => {
  const [files, setFiles] = React.useState<FileInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    const loadFiles = async () => {
      try {
        const fileTree = await api.getFiles();
        setFiles(fileTree);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load files');
        setLoading(false);
      }
    };

    loadFiles();
  }, []);

  const renderFileTree = (items: FileInfo[], level = 0) => {
    return items.map((item) => (
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
            selected={selectedFile === item.path}
            onClick={() => item.type === 'file' && onFileSelect(item.path)}
            disabled={item.type !== 'file'}
            dense
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {item.type === 'folder' ? (
                <FolderIcon color="action" fontSize="small" />
              ) : (
                <FileIcon color="action" fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={item.type === 'folder' ? item.name : item.name.replace(/\.md$/, '')}
              primaryTypographyProps={{
                variant: 'body2',
                sx: {
                  fontWeight: selectedFile === item.path ? 500 : 400,
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
    ));
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
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
