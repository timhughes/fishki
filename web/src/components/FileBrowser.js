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
import { useNavigate, useLocation } from 'react-router-dom';

function FileTree({ files, level = 0, onSelect }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const navigate = useNavigate();
  const location = useLocation();

  const toggleFolder = (path) => {
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

  const getPathWithoutExtension = (path) => {
    return path.replace(/\.md$/, '');
  };

  const sortFiles = (files) => {
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
}

function FileBrowser() {
  const [files, setFiles] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newPageDialogOpen, setNewPageDialogOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageError, setNewPageError] = useState('');
  const navigate = useNavigate();

  const loadFiles = () => {
    fetch('/api/files')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load file list');
        }
        return response.json();
      })
      .then(setFiles)
      .catch((err) => setError(err.message));
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

  const handleCreatePage = () => {
    if (!newPageName) {
      setNewPageError('Page name is required');
      return;
    }

    const pageName = `${newPageName.trim().replace(/\.md$/, '')}.md`;
    
    fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: pageName,
        content: `# ${pageName.replace(/\.md$/, '')}`,
      }),
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to create page');
      setNewPageDialogOpen(false);
      setNewPageName('');
      setNewPageError('');
      setRefreshTrigger(prev => prev + 1);
      navigate(`/${pageName.replace(/\.md$/, '')}`);
    })
    .catch(err => setNewPageError(err.message));
  };

  const toggleDrawer = () => {
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
            placeholder="my-new-page"
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
}

export default FileBrowser;
