import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

function Breadcrumbs() {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isEditing = location.pathname.endsWith('/edit');

  if (isEditing) {
    pathParts.pop(); // Remove 'edit' from the path
  }

  // If we're at the root, don't show breadcrumbs
  if (pathParts.length === 0 && !isEditing) {
    return null;
  }

  return (
    <MuiBreadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
      <Link
        component={RouterLink}
        to="/"
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: 'inherit',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        }}
      >
        <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
        Home
      </Link>
      
      {pathParts.map((part, index) => {
        const path = `/${pathParts.slice(0, index + 1).join('/')}`;
        const isLast = index === pathParts.length - 1;
        const displayText = part.replace('.md', '');

        if (isLast) {
          return (
            <Typography color="text.primary" key={path}>
              {displayText}
              {isEditing && ' (Editing)'}
            </Typography>
          );
        }

        return (
          <Link
            component={RouterLink}
            to={path}
            key={path}
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {displayText}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}

export default Breadcrumbs;
