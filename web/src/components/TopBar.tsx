import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Tooltip 
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { NavigateFunction } from 'react-router-dom';

interface TopBarProps {
  onToggleTheme: () => void;
  currentTheme: 'light' | 'dark';
}

const TopBar: React.FC<TopBarProps> = ({ onToggleTheme, currentTheme }) => {
  const navigate: NavigateFunction = useNavigate();
  const location = useLocation();
  const isEditing: boolean = location.pathname.endsWith('/edit');
  const path: string = location.pathname.replace('/edit', '');

  const handleEditClick = (): void => {
    if (isEditing) {
      navigate(path);
    } else {
      navigate(`${path}${path === '/' ? 'edit' : '/edit'}`);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Fishki Wiki
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={currentTheme === 'dark' ? 'Light mode' : 'Dark mode'}>
            <IconButton color="inherit" onClick={onToggleTheme}>
              {currentTheme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={isEditing ? 'View page' : 'Edit page'}>
            <Button 
              color="inherit" 
              onClick={handleEditClick}
              startIcon={isEditing ? <VisibilityIcon /> : <EditIcon />}
            >
              {isEditing ? 'View' : 'Edit'}
            </Button>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
