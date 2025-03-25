import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, SxProps, Theme } from '@mui/material';
import { useLocation, Link as RouterLink, Location } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

const linkStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  color: 'inherit',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
};

const Breadcrumbs: React.FC = () => {
  const location: Location = useLocation();
  const pathParts: string[] = location.pathname.split('/').filter(Boolean);
  const isEditing: boolean = location.pathname.endsWith('/edit');

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
        sx={linkStyles}
      >
        <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
        Home
      </Link>
      
      {pathParts.map((part: string, index: number) => {
        const path: string = `/${pathParts.slice(0, index + 1).join('/')}`;
        const isLast: boolean = index === pathParts.length - 1;
        const displayText: string = part.replace('.md', '');

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
            sx={linkStyles}
          >
            {displayText}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};

export default Breadcrumbs;
