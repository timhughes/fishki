import React, { useState, useCallback, useMemo } from 'react';
import { List, ListItem, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import {
  Description as FileIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileTreeProps } from '../types/files';

const FileTree: React.FC<FileTreeProps> = ({ files, level = 0, onSelect }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const location = useLocation();

  const toggleFolder = useCallback((path: string): void => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const getPathWithoutExtension = useCallback((path: string): string => {
    return path.replace(/\.md$/, '');
  }, []);

  const handleEdit = useCallback((e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    navigate(`/${getPathWithoutExtension(filePath)}/edit`);
    if (onSelect) onSelect();
  }, [navigate, getPathWithoutExtension, onSelect]);

  const handleView = useCallback((filePath: string) => {
    const cleanPath = getPathWithoutExtension(filePath);
    console.log('FileTree - Viewing path:', filePath);
    console.log('FileTree - Clean path:', cleanPath);
    navigate('/' + cleanPath); // Ensure we always have a leading slash
    if (onSelect) onSelect();
  }, [navigate, getPathWithoutExtension, onSelect]);

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [files]);

  return (
    <List sx={{ pl: level * 2 }}>
      {sortedFiles.map((file) => {
        const isFolder = file.type === 'folder';
        const isExpanded = expandedFolders.has(file.path);
        const cleanPath = getPathWithoutExtension(file.path);
        const isCurrentFile = location.pathname === `/${cleanPath}` || 
                            location.pathname === `/${cleanPath}/edit`;

        console.log('FileTree - Rendering file:', {
          path: file.path,
          cleanPath,
          currentPath: location.pathname,
          isCurrentFile
        });

        return (
          <React.Fragment key={file.path}>
            <ListItem
              button
              onClick={() => isFolder ? toggleFolder(file.path) : handleView(file.path)}
              sx={{
                bgcolor: isCurrentFile ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                pr: 1, // Make room for edit button
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {isFolder ? (
                  isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />
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
              {!isFolder && (
                <IconButton
                  size="small"
                  onClick={(e) => handleEdit(e, file.path)}
                  sx={{ ml: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
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

export default FileTree;
