import React from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Box, AppBar, Toolbar, Typography, IconButton, CircularProgress, Alert } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { PageBrowser } from './components/PageBrowser';
import { MarkdownViewer } from './components/MarkdownViewer';
import { MarkdownEditor } from './components/MarkdownEditor';
import { CreatePage } from './components/CreatePage';
import { UnsavedChangesDialog } from './components/UnsavedChangesDialog';
import { NavigationBlocker } from './components/NavigationBlocker';
import { useNavigation } from './contexts/NavigationContext';
import { api } from './api/client';
import { addMdExtension, removeMdExtension } from './utils/path';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f5f5f5',
        },
      },
    },
  },
});

// Route components
const ViewPage = ({ onPageDeleted }: { onPageDeleted: () => void }) => {
  const { '*': path } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [pageDeleted, setPageDeleted] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  
  // Check if this is a folder path and should load an index file
  React.useEffect(() => {
    const checkForIndex = async () => {
      setLoading(true);
      
      // Handle paths ending with slash or explicit folder navigation
      const isFolder = path?.endsWith('/') || location.pathname.endsWith('/');
      const cleanPath = path?.endsWith('/') ? path.slice(0, -1) : path;
      
      try {
        if (isFolder || !path) {
          // For folder paths, try to load the index file
          const indexPath = cleanPath ? `${cleanPath}/index.md` : 'index.md';
          try {
            await api.load(indexPath);
            // If successful and we're not already viewing the index, navigate to it
            if (!cleanPath?.endsWith('/index') && cleanPath !== 'index') {
              navigate(`/page/${cleanPath ? `${cleanPath}/index` : 'index'}`);
            }
          } catch (err) {
            // If index doesn't exist, show create page interface for the index
            navigate(`/edit/${cleanPath ? `${cleanPath}/index` : 'index'}`);
          }
        }
      } catch (err) {
        // Handle any other errors
      } finally {
        setLoading(false);
      }
    };
    
    checkForIndex();
  }, [path, navigate, location.pathname]);
  
  const handleEdit = () => {
    navigate(`/edit/${path}`);
  };

  const handleCreate = () => {
    navigate(`/edit/${path}`);
  };

  const handleDelete = () => {
    setPageDeleted(true); // Mark the page as deleted
    onPageDeleted();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!path || pageDeleted) {
    return <CreatePage path={path || ''} onCreateClick={handleCreate} />;
  }

  return (
    <MarkdownViewer
      filePath={addMdExtension(path)}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onNotFound={() => <CreatePage path={path} onCreateClick={handleCreate} />}
    />
  );
};

const EditPage = ({ onPageCreated }: { onPageCreated: () => void }) => {
  const { '*': path } = useParams();
  const navigate = useNavigate();
  const [initialContent, setInitialContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [pageExists, setPageExists] = React.useState(true);
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(undefined);
        const content = await api.load(addMdExtension(path || ''));
        setInitialContent(content);
        setPageExists(true);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === '404') {
            setInitialContent(`# ${path?.split('/').pop() || 'New Page'}\n\n`);
            setPageExists(false);
          } else {
            setError(err.message);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [path]);

  const handleSave = () => {
    if (!pageExists) {
      onPageCreated();
    }
    navigate(`/page/${path}`);
  };

  const handleCancel = () => {
    navigate(`/page/${path}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <MarkdownEditor
      filePath={addMdExtension(path || '')}
      initialContent={initialContent}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

function App() {
  const [drawerOpen, setDrawerOpen] = React.useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  
  // Use our navigation context
  const { 
    blockNavigation, 
    pendingLocation, 
    setPendingLocation, 
    confirmNavigation, 
    cancelNavigation,
    setNavigationCallback
  } = useNavigation();

  // Handle file selection from the tree view
  const handleFileSelect = (path: string) => {
    // Remove .md extension from path before navigating
    const cleanPath = removeMdExtension(path);
    
    // Check if navigation should be blocked
    if (blockNavigation && location.pathname.startsWith('/edit/')) {
      // Store the pending navigation and show confirmation dialog
      setPendingLocation(`/page/${cleanPath}`);
      setNavigationCallback(() => () => navigate(`/page/${cleanPath}`));
    } else {
      // Navigate directly if no blocking needed
      navigate(`/page/${cleanPath}`);
    }
  };

  // Check if the current path is a folder and has an index file
  const checkForIndexFile = React.useCallback(async (path: string) => {
    try {
      // Try to load the index file for the current path
      const indexPath = path ? `${path}/index` : 'index';
      await api.load(addMdExtension(indexPath));
      // If successful, navigate to the index file
      return true;
    } catch (err) {
      // If the index file doesn't exist, do nothing
      return false;
    }
  }, [navigate]);

  const handlePageCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handlePageDeleted = () => {
    // Force a refresh of the page browser
    setRefreshTrigger(prev => prev + 1);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* App Bar */}
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Fishki Wiki
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Box
          component="nav"
          sx={{
            width: drawerOpen ? 300 : 0,
            flexShrink: 0,
            transition: 'width 0.2s',
            overflow: 'hidden',
          }}
        >
          <Toolbar /> {/* Spacer to push content below AppBar */}
          <PageBrowser
            onFileSelect={handleFileSelect}
            selectedFile={location.pathname.replace(/^\/(?:page|edit)\//, '')}
            refreshTrigger={refreshTrigger}
          />
        </Box>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: drawerOpen ? 'calc(100% - 300px)' : '100%',
            transition: 'width 0.2s',
            bgcolor: 'background.default',
          }}
        >
          <Toolbar /> {/* Spacer to push content below AppBar */}
          <Routes>
            <Route path="/page/*" element={<ViewPage onPageDeleted={handlePageDeleted} />} />
            <Route path="/edit/*" element={<EditPage onPageCreated={handlePageCreated} />} />
            <Route path="/*" element={<ViewPage onPageDeleted={handlePageDeleted} />} />
          </Routes>
        </Box>

        {/* Navigation components */}
        <NavigationBlocker />
        <UnsavedChangesDialog
          open={!!pendingLocation}
          onContinue={confirmNavigation}
          onCancel={cancelNavigation}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
