import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';

interface ResizablePanelProps {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  storageKey: string;
  children: React.ReactNode;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  initialWidth,
  minWidth,
  maxWidth,
  storageKey,
  children
}) => {
  // Try to get saved width from localStorage, or use initialWidth
  const [width, setWidth] = useState<number>(() => {
    try {
      const savedWidth = localStorage.getItem(storageKey);
      return savedWidth ? parseInt(savedWidth, 10) : initialWidth;
    } catch (e) {
      return initialWidth;
    }
  });
  
  const [isResizing, setIsResizing] = useState(false);

  // Save width to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, width.toString());
      // Also set a CSS variable to use for the main content margin
      document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
    } catch (e) {
      console.error('Failed to save panel width to localStorage:', e);
    }
  }, [width, storageKey]);

  // Set the CSS variable on initial load
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
  }, []);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    }
  }, [isResizing, minWidth, maxWidth]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
    }
    
    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing, resize, stopResize]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: `${width}px`,
        height: '100%',
        transition: isResizing ? 'none' : 'width 0.1s',
      }}
    >
      {children}
      
      {/* Resize handle */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: -4,
          width: 8,
          height: '100%',
          cursor: 'col-resize',
          zIndex: 1000,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
          },
          '&:active': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }
        }}
        onMouseDown={startResize}
      />
    </Box>
  );
};
