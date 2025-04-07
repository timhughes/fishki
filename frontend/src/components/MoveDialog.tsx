import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
} from '@mui/material';
import { DriveFileMove as MoveIcon } from '@mui/icons-material';
import { api } from '../api/client';
import { FileInfo } from '../types/api';

interface MoveDialogProps {
  open: boolean;
  currentPath: string;
  onConfirm: (newPath: string) => Promise<void>;
  onCancel: () => void;
  moving?: boolean;
  error?: string;
}

export const MoveDialog: React.FC<MoveDialogProps> = ({
  open,
  currentPath,
  onConfirm,
  onCancel,
  moving = false,
  error,
}) => {
  // Extract the filename and directory from the current path
  const pathParts = currentPath.split('/');
  const currentFilename = pathParts.pop() || '';
  const currentDirectory = pathParts.join('/');
  
  // Remove .md extension if present
  const displayName = currentFilename.replace(/\.md$/, '');
  
  const [newName, setNewName] = useState(displayName);
  const [targetDirectory, setTargetDirectory] = useState(currentDirectory);
  const [validationError, setValidationError] = useState('');
  const [folders, setFolders] = useState<string[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [folderError, setFolderError] = useState('');

  // Load available folders when dialog opens
  useEffect(() => {
    let isMounted = true;
    
    const fetchFolders = async () => {
      if (open) {
        try {
          if (isMounted) setLoadingFolders(true);
          if (isMounted) setFolderError('');
          
          const fileTree = await api.getFiles();
          const folderPaths = extractFolderPaths(fileTree);
          
          // Add root directory
          folderPaths.unshift('');
          
          // Only update state if component is still mounted
          if (isMounted) {
            // Log the folders for debugging (only in development)
            if (process.env.NODE_ENV === 'development') {
              console.log('Available folders:', folderPaths);
            }
            
            setFolders(folderPaths);
          }
        } catch (err) {
          if (isMounted) {
            setFolderError('Failed to load folders');
            console.error('Failed to load folders:', err);
          }
        } finally {
          if (isMounted) {
            setLoadingFolders(false);
          }
        }
      }
    };
    
    // Use a microtask to allow tests to properly wrap state updates in act()
    Promise.resolve().then(fetchFolders);
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [open]);

  // Reset the form when the dialog opens
  useEffect(() => {
    if (open) {
      setNewName(displayName);
      setTargetDirectory(currentDirectory);
      setValidationError('');
    }
  }, [open, displayName, currentDirectory]);

  // Recursive function to extract folder paths from file tree
  const extractFolderPaths = (items: FileInfo[]): string[] => {
    let paths: string[] = [];
    
    // Check if we have a repository folder at the root
    if (items.length > 0 && items[0].type === 'folder' && items[0].children) {
      // Process each child of the repository folder
      for (const child of items[0].children) {
        if (child.type === 'folder') {
          // Add this folder
          paths.push(child.path);
          
          // Process subfolders recursively
          if (child.children) {
            for (const subChild of child.children) {
              if (subChild.type === 'folder') {
                paths.push(subChild.path);
                // Continue recursion if needed
                addSubfolders(subChild, paths);
              }
            }
          }
        }
      }
    }
    
    return paths;
  };
  
  // Helper function to add all subfolders recursively
  const addSubfolders = (folder: FileInfo, paths: string[]): void => {
    if (folder.children) {
      for (const child of folder.children) {
        if (child.type === 'folder') {
          paths.push(child.path);
          addSubfolders(child, paths);
        }
      }
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewName(value);
    
    // Basic validation
    if (!value.trim()) {
      setValidationError('Page name cannot be empty');
    } else if (value.includes('/') || value.includes('\\')) {
      setValidationError('Page name cannot contain slashes');
    } else {
      setValidationError('');
    }
  };

  const handleDirectoryChange = (e: SelectChangeEvent<string>) => {
    setTargetDirectory(e.target.value);
  };

  const handleConfirm = async () => {
    if (validationError) return;
    
    // Construct the new path
    const newPath = targetDirectory 
      ? `${targetDirectory}/${newName}.md` 
      : `${newName}.md`;
    
    // Check if the path is the same as the current path
    if (newPath === currentPath) {
      setValidationError('New path is the same as the current path');
      return;
    }
    
    await onConfirm(newPath);
  };

  return (
    <Dialog
      open={open}
      onClose={!moving ? onCancel : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MoveIcon color="primary" />
        Move Page
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Current path:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              p: 1,
              bgcolor: 'grey.100',
              borderRadius: 1,
              fontFamily: 'monospace',
              mb: 3,
            }}
          >
            {currentPath.replace(/\.md$/, '')}
          </Typography>
          
          <FormControl fullWidth margin="dense" disabled={moving || loadingFolders}>
            <InputLabel id="target-directory-label">Target Directory</InputLabel>
            <Select
              labelId="target-directory-label"
              id="target-directory"
              value={targetDirectory}
              label="Target Directory"
              onChange={handleDirectoryChange}
            >
              {folders.map((folder) => (
                <MenuItem key={folder} value={folder}>
                  {folder ? `/${folder}` : '/ (root)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Divider sx={{ my: 2 }} />
          
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="New Page Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={handleNameChange}
            error={!!validationError}
            helperText={validationError || "Enter the new name for this page"}
            disabled={moving}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            New path will be: <code>{targetDirectory ? `/${targetDirectory}/` : '/'}{newName}</code>
          </Typography>
        </Box>
        
        {folderError && (
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            {folderError}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onCancel}
          disabled={moving}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={moving || !!validationError || loadingFolders}
          color="primary"
          variant="contained"
          startIcon={moving ? <CircularProgress size={20} /> : <MoveIcon />}
        >
          {moving ? 'Moving...' : 'Move'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
