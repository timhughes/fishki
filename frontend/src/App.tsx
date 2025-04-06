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
  const params = useParams();
  const path = params['*'] || '';
  const navigate = useNavigate();
  const location = useLocation();
  const [pageDeleted, setPageDeleted] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  
  // Reset pageDeleted state when path changes
  React.useEffect(() => {
    setPageDeleted(false);
  }, [path]);
  
  // Check if this is a folder path and should load an index file
  React.useEffect(() => {
    const checkForIndex = async () => {
      // Skip processing if we're already on an index page
      if (location.pathname.endsWith('/index')) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      // Handle paths ending with slash or explicit folder navigation
      const isFolder = path?.endsWith('/') || location.pathname.endsWith('/');
      
      if (isFolder || !path) {
        // For folder paths, navigate directly to the index path
        const cleanPath = path?.replace(/\/$/, ''); // Remove trailing slash if present
        navigate(`/page/${cleanPath ? `${cleanPath}/index` : 'index'}`);
        return; // Exit early, we're navigating away
      }
      
      setLoading(false);
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

  // Check if this is a folder index path that might need to be created
  const isIndexPath = path?.endsWith('/index') || path === 'index';
  const isFolder = location.pathname.endsWith('/') && !location.pathname.endsWith('/index/');
  
  if (!path || pageDeleted || (isIndexPath && isFolder)) {
    // For deleted pages, non-existent paths, or folder index pages that don't exist
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
  const params = useParams();
  const path = params['*'] || '';
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
