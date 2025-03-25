import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import {
  Description as FileIcon,
  Folder as FolderIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  MenuOpen as MenuOpenIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, NavigateFunction } from 'react-router-dom';

interface FileInfo {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileInfo[];
}

interface FileTreeProps {
  files: FileInfo[];
  level?: number;
  onSelect?: () => void;
}

interface APIResponse {
  ok: boolean;
}

const FileTree: React.FC<FileTreeProps> = ({ files, level = 0, onSelect }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const navigate: NavigateFunction = useNavigate();
  const location = useLocation();

  const toggleFolder = (path: string): void => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getPathWithoutExtension = (path: string): string => {
    return path.replace(/\.md$/, '');
  };

  const sortFiles = (files: FileInfo[]): FileInfo[] => {
    return [...files].sort((a, b) => {
      // Sort folders before files
      const aIsFolder = a.type === 'folder';
      const bIsFolder = b.type === 'folder';
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      // Sort by name
      return a.name.localeCompare(b.name);
    });
  };

  return (
    <List sx={{ pl: level * 2 }}>
      {sortFiles(files).map((file) => {
        const isFolder = file.type === 'folder';
        const isExpanded = expandedFolders.has(file.path);
        const isCurrentFile = location.pathname === `/${getPathWithoutExtension(file.path)}`;

        return (
          <React.Fragment key={file.path}>
            <ListItem
              button
              onClick={() => {
                if (isFolder) {
                  toggleFolder(file.path);
                } else {
                  navigate(`/${file.path.replace(/\.md$/, '')}`);
                  if (onSelect) onSelect();
                }
              }}
              sx={{
                bgcolor: isCurrentFile ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {isFolder ? (
                  isExpanded ? (
                    <ExpandMoreIcon />
                  ) : (
                    <ChevronRightIcon />
                  )
                ) : (
                  <FileIcon />
                )}
              </ListItemIcon>
              <ListItemText 
                primary={file.name.replace(/\.md$/, '')}
                sx={{ 
                  '& .MuiListItemText-primary': { 
                    fontSize: '0.9rem',
                  } 
                }}
              />
            </ListItem>
            {isFolder && isExpanded && file.children && (
              <FileTree
                files={file.children}
                level={level + 1}
                onSelect={onSelect}
              />
            )}
          </React.Fragment>
        );
      })}
    </List>
  );
};

const FileBrowser: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [newPageDialogOpen, setNewPageDialogOpen] = useState<boolean>(false);
  const [newPageName, setNewPageName] = useState<string>('');
  const [newPageError, setNewPageError] = useState<string>('');
  const navigate: NavigateFunction = useNavigate();

  const loadFiles = async (): Promise<void> => {
    try {
      const response = await fetch('/api/files');
      if (!response.ok) {
        throw new Error('Failed to load file list');
      }
      const data: FileInfo[] = await response.json();
      setFiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger]);

  useEffect(() => {
    // Listen for save events
    const handleSave = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('wiki-save', handleSave);
    return () => window.removeEventListener('wiki-save', handleSave);
  }, []);

  const handleCreatePage = async (): Promise<void> => {
    if (!newPageName) {
      setNewPageError('Page name is required');
      return;
    }

    // Clean and validate the path
    const cleanPath = newPageName.trim()
      .replace(/\.md$/, '')  // Remove .md if present
      .replace(/\/{2,}/g, '/') // Replace multiple slashes with single
      .replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes

    if (!cleanPath) {
      setNewPageError('Invalid page name');
      return;
    }

    const pageName = cleanPath + '.md';
    
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: pageName,
          content: `# ${cleanPath.split('/').pop()}`,
        }),
      });

      if (!response.ok) throw new Error('Failed to create page');
      
      setNewPageDialogOpen(false);
      setNewPageName('');
      setNewPageError('');
      setRefreshTrigger(prev => prev + 1);
      navigate(`/${cleanPath}`);
    } catch (err) {
      setNewPageError(err instanceof Error ? err.message : 'Failed to create page');
    }
  };

  const toggleDrawer = (): void => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <Tooltip title="File Browser">
        <IconButton 
          onClick={toggleDrawer}
          sx={{ 
            position: 'fixed', 
            left: isOpen ? 250 : 10, 
            top: 80,
            bgcolor: 'background.paper',
            transition: 'left 0.3s',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <MenuOpenIcon />
        </IconButton>
      </Tooltip>
      <Drawer
        variant="persistent"
        open={isOpen}
        anchor="left"
        sx={{
          width: 250,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 250,
            boxSizing: 'border-box',
            top: 64,
            height: 'calc(100% - 64px)',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Files</Typography>
          <Tooltip title="New Page">
            <IconButton onClick={() => setNewPageDialogOpen(true)}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider />
        {error ? (
          <Typography color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        ) : (
          <FileTree files={files} onSelect={() => setIsOpen(false)} />
        )}
      </Drawer>
      <Dialog open={newPageDialogOpen} onClose={() => setNewPageDialogOpen(false)}>
        <DialogTitle>Create New Page</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Page Name"
            fullWidth
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            error={!!newPageError}
            placeholder="folder/my-new-page"
            helperText="Use forward slashes (/) to create pages in subdirectories"
            sx={{ mt: 1 }}
          />
          {newPageError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {newPageError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewPageDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePage} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileBrowser;
