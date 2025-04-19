import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

interface FileBreadcrumbsProps {
  filePath: string;
  rootName?: string;
}

export const FileBreadcrumbs: React.FC<FileBreadcrumbsProps> = ({ 
  filePath, 
  rootName = 'fishki' 
}) => {
  const theme = useTheme();
  
  // Remove .md extension if present
  const cleanPath = filePath.replace(/\.md$/, '');
  
  // Split the path into segments
  const segments = cleanPath.split('/').filter(Boolean);
  
  // Create breadcrumb items
  const breadcrumbItems = [];
  
  // Add root item (repository name)
  breadcrumbItems.push(
    <Link
      component={RouterLink}
      underline="hover"
      sx={{ display: 'flex', alignItems: 'center' }}
      color="inherit"
      to="/page/"
      key="home"
    >
      <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
      {rootName}
    </Link>
  );
  
  // Add intermediate path segments
  for (let i = 0; i < segments.length - 1; i++) {
    const segmentPath = segments.slice(0, i + 1).join('/');
    breadcrumbItems.push(
      <Link
        component={RouterLink}
        underline="hover"
        color="inherit"
        to={`/page/${segmentPath}/`}
        key={segmentPath}
      >
        {segments[i]}
      </Link>
    );
  }
  
  // Add current page (last segment) as non-clickable
  if (segments.length > 0) {
    breadcrumbItems.push(
      <Typography 
        color="text.primary" 
        key="current"
        sx={{ 
          fontWeight: 'medium',
          color: theme.palette.primary.main
        }}
      >
        {segments[segments.length - 1]}
      </Typography>
    );
  }
  
  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" separator="›" sx={{ fontSize: '0.9rem' }}>
        {breadcrumbItems}
      </Breadcrumbs>
    </Box>
  );
};
