import React, { useState, useCallback, useMemo } from 'react';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  Description as FileIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
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

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      // Sort folders before files
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      // Sort by name
      return a.name.localeCompare(b.name);
    });
  }, [files]);

  return (
    <List sx={{ pl: level * 2 }}>
      {sortedFiles.map((file) => {
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
                  navigate(`/${getPathWithoutExtension(file.path)}`);
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
