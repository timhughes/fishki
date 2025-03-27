import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';
import useMediaQuery from '@mui/material/useMediaQuery';

import TopBar from './components/TopBar';
import Breadcrumbs from './components/Breadcrumbs';
import FileBrowser from './components/FileBrowser';
import WikiPage from './components/WikiPage';
import Editor from './components/Editor';

type ThemeMode = 'light' | 'dark';

const App: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<ThemeMode>(prefersDarkMode ? 'dark' : 'light');

  const theme: Theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#90caf9' : '#1976d2',
          },
          secondary: {
            main: mode === 'dark' ? '#f48fb1' : '#dc004e',
          },
          background: {
            default: mode === 'dark' ? '#121212' : '#fff',
            paper: mode === 'dark' ? '#1e1e1e' : '#fff',
          },
        },
      }),
    [mode]
  );

  const toggleColorMode = (): void => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <TopBar onToggleTheme={toggleColorMode} currentTheme={mode} />
          <FileBrowser />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 3,
              transition: 'margin 0.3s',
            }}
          >
            <Breadcrumbs />
            <Routes>
              <Route path="/*" element={<WikiPage />} />
              <Route path="/:path(*)/edit" element={<Editor />} />
              <Route path="/edit" element={<Editor />} />
            </Routes>
          </Box>
        </Box>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
