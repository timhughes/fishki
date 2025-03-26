import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
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
  MenuOpen as MenuOpenIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { listFiles } from '../services/api';
import useFileOperations from '../hooks/useFileOperations';
import FileTree from './FileTree';
import type { FileInfo } from '../types/files';

const FileBrowser: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [newPageDialogOpen, setNewPageDialogOpen] = useState<boolean>(false);
  const [newPageName, setNewPageName] = useState<string>('');
  const [newPageError, setNewPageError] = useState<string>('');
  const navigate = useNavigate();
  const { createFile, loading: savingFile } = useFileOperations();

  const loadFiles = useCallback(async () => {
    try {
      const data = await listFiles();
      setFiles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file list');
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles, refreshTrigger]);

  useEffect(() => {
    const handleSave = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('wiki-save', handleSave);
    return () => window.removeEventListener('wiki-save', handleSave);
  }, []);

  const validateAndCleanPath = useCallback((path: string): string | null => {
    const cleaned = path.trim()
      .replace(/\.md$/, '')
      .replace(/\/{2,}/g, '/')
      .replace(/^\/+|\/+$/g, '');

    if (!cleaned) {
      throw new Error('Invalid page name');
    }

    return cleaned;
  }, []);

  const handleCreatePage = useCallback(async () => {
    if (!newPageName) {
      setNewPageError('Page name is required');
      return;
    }

    try {
      const cleanPath = validateAndCleanPath(newPageName);
      if (!cleanPath) {
        setNewPageError('Invalid page name');
        return;
      }

      const pageName = `${cleanPath}.md`;
      const pageTitle = cleanPath.split('/').pop() || cleanPath;
      
      await createFile(pageName, `# ${pageTitle}`);
      setNewPageDialogOpen(false);
      setNewPageName('');
      setNewPageError('');
      setRefreshTrigger(prev => prev + 1);
      navigate(`/${cleanPath}`);
    } catch (err) {
      setNewPageError(err instanceof Error ? err.message : 'Failed to create page');
    }
  }, [newPageName, createFile, navigate, validateAndCleanPath]);

  const toggleDrawer = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeNewPageDialog = useCallback(() => {
    setNewPageDialogOpen(false);
    setNewPageName('');
    setNewPageError('');
  }, []);

  const drawerPosition = useMemo(() => ({
    position: 'fixed',
    left: isOpen ? 250 : 10,
    top: 80,
    bgcolor: 'background.paper',
    transition: 'left 0.3s',
    '&:hover': {
      bgcolor: 'action.hover',
    },
  }), [isOpen]);

  return (
    <>
      <Tooltip title="File Browser">
        <IconButton 
          onClick={toggleDrawer}
          sx={drawerPosition}
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

      <Dialog open={newPageDialogOpen} onClose={closeNewPageDialog}>
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
          <Button onClick={closeNewPageDialog}>Cancel</Button>
          <Button 
            onClick={handleCreatePage} 
            variant="contained" 
            disabled={savingFile}
          >
            {savingFile ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileBrowser;
