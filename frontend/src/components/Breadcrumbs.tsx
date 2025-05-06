import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import Box from '@mui/material/Box';
import { removeMdExtension } from '../utils/path';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface FileBreadcrumbsProps {
  filePath: string;
}

export const FileBreadcrumbs: React.FC<FileBreadcrumbsProps> = ({ filePath }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Remove .md extension if present
  const cleanPath = removeMdExtension(filePath);
  
  // Split the path into segments
  const segments = cleanPath.split('/').filter(Boolean);
  
  // Build the breadcrumb items
  const breadcrumbItems = [];
  
  // Add home link
  breadcrumbItems.push(
    <Link
      key="home"
      component={RouterLink}
      to="/page/index"
      color="inherit"
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        fontSize: { xs: '0.85rem', sm: '0.875rem' }
      }}
    >
      <HomeIcon sx={{ mr: 0.5, fontSize: { xs: '0.9rem', sm: '1rem' } }} />
      {!isMobile && 'Home'}
    </Link>
  );
  
  // Add intermediate segments
  let currentPath = '';
  for (let i = 0; i < segments.length - 1; i++) {
    currentPath += `${segments[i]}/`;
    
    // For mobile, only show the last segment and first segment
    if (isMobile && i !== 0 && segments.length > 3 && i < segments.length - 2) {
      if (i === 1) {
        breadcrumbItems.push(
          <Typography 
            key="ellipsis" 
            color="text.secondary" 
            sx={{ fontSize: '0.85rem' }}
          >
            ...
          </Typography>
        );
      }
      continue;
    }
    
    breadcrumbItems.push(
      <Link
        key={currentPath}
        component={RouterLink}
        to={`/page/${currentPath}index`}
        color="inherit"
        sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}
      >
        {segments[i]}
      </Link>
    );
  }
  
  // Add current segment (if any)
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    breadcrumbItems.push(
      <Typography 
        key="current" 
        color="text.primary" 
        sx={{ 
          fontWeight: 500,
          fontSize: { xs: '0.85rem', sm: '0.875rem' },
          maxWidth: { xs: '120px', sm: '200px', md: '300px' },
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {lastSegment}
      </Typography>
    );
  }
  
  return (
    <Box sx={{ 
      overflow: 'hidden',
      maxWidth: '100%'
    }}>
      <Breadcrumbs 
        aria-label="breadcrumb"
        sx={{ 
          flexWrap: 'nowrap',
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap'
          }
        }}
      >
        {breadcrumbItems}
      </Breadcrumbs>
    </Box>
  );
};
