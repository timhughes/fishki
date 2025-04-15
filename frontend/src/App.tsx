import React, { lazy, Suspense, useMemo, useState } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import MenuIcon from '@mui/icons-material/Menu';
import { PageBrowser } from './components/PageBrowser';
import { UnsavedChangesDialog } from './components/UnsavedChangesDialog';
import { NavigationBlocker } from './components/NavigationBlocker';
import { SetupWizard } from './components/SetupWizard';
import { ThemeToggle } from './components/ThemeToggle';
import { NewPageDialog } from './components/NewPageDialog';
import { ResizablePanel } from './components/ResizablePanel';
import { useTheme } from './contexts/ThemeContext';
import { useNavigation } from './contexts/NavigationContext';
import { api } from './api/client';
import { addMdExtension, removeMdExtension } from './utils/path';

// Lazy load components to reduce initial bundle size
const MarkdownViewer = lazy(() => import('./components/MarkdownViewer').then(module => ({ 
  default: module.MarkdownViewer 
})));
const MarkdownEditor = lazy(() => import('./components/MarkdownEditor').then(module => ({ 
  default: module.MarkdownEditor 
})));
const CreatePage = lazy(() => import('./components/CreatePage').then(module => ({ 
  default: module.CreatePage 
})));

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
  
  // Simple loading state management
  React.useEffect(() => {
    // Just set loading to false after component mounts
    setLoading(false);
  }, [path, location.pathname]);
  
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
  
  const handleRename = () => {
    // Trigger a refresh of the file tree after rename
    onPageDeleted(); // Reuse the same function as delete since it refreshes the tree
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
    return (
      <Suspense fallback={<CircularProgress />}>
        <CreatePage path={path || ''} onCreateClick={handleCreate} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<CircularProgress />}>
      <MarkdownViewer
        filePath={addMdExtension(path)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRename={handleRename}
        onNotFound={() => <CreatePage path={path} onCreateClick={handleCreate} />}
      />
    </Suspense>
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
    <Suspense fallback={<CircularProgress />}>
      <MarkdownEditor
        filePath={addMdExtension(path || '')}
        initialContent={initialContent}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </Suspense>
  );
};

function AppContent() {
  const [drawerOpen, setDrawerOpen] = React.useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [setupWizardOpen, setSetupWizardOpen] = React.useState(false);
  const [wikiPathSet, setWikiPathSet] = React.useState(true);
  const [appLoading, setAppLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  
  // New page dialog state
  const [newPageDialogOpen, setNewPageDialogOpen] = useState(false);
  const [currentFolderPath, setCurrentFolderPath] = useState('');
  
  // Use our navigation context
  const { 
    blockNavigation, 
    pendingLocation, 
    setPendingLocation, 
    confirmNavigation, 
    cancelNavigation,
    setNavigationCallback
  } = useNavigation();

  // Get theme mode from context
  const { mode } = useTheme();

  // Create theme based on current mode
  const theme = useMemo(() => createTheme({
    palette: {
      mode: mode,
      primary: {
        main: '#2196f3',
      },
      secondary: {
        main: '#f50057',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'light' ? '#f5f5f5' : '#121212',
          },
        },
      },
    },
  }), [mode]);

  React.useEffect(() => {
    // Check if wiki path is set
    const checkWikiPath = async () => {
      try {
        const config = await api.getConfig();
        if (!config.wikiPath) {
          setWikiPathSet(false);
          setSetupWizardOpen(true);
        }
      } catch (err) {
        setErrorMessage('Failed to load configuration');
      } finally {
        setAppLoading(false);
      }
    };

    checkWikiPath();
  }, []);

  const handleSetupComplete = () => {
    setSetupWizardOpen(false);
    setWikiPathSet(true);
    window.location.reload(); // Reload to refresh the file tree
  };

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
  
  // Handle creating a new page from the tree view
  const handleCreateInFolder = (folderPath: string) => {
    // Open the dialog to name the page
    setCurrentFolderPath(folderPath);
    setNewPageDialogOpen(true);
  };
  
  // Handle confirmation from the new page dialog
  const handleNewPageConfirm = (pageName: string, folderPath: string) => {
    setNewPageDialogOpen(false);
    
    // Create the full path for the new page
    const fullPath = folderPath ? `${folderPath}${pageName}` : pageName;
    
    // Navigate to edit mode for the new page
    navigate(`/edit/${fullPath}`);
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
    <MuiThemeProvider theme={theme}>
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
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Fishki Wiki
            </Typography>
            <ThemeToggle />
          </Toolbar>
        </AppBar>

        {/* Sidebar with resizable panel */}
        {drawerOpen && (
          <Box
            component="nav"
            sx={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              left: 0,
              zIndex: theme => theme.zIndex.drawer,
              bgcolor: 'background.paper',
              height: '100%',
            }}
          >
            <Toolbar /> {/* Spacer to push content below AppBar */}
            <Box sx={{ height: 'calc(100vh - 64px)' }}>
              <ResizablePanel
                initialWidth={300}
                minWidth={200}
                maxWidth={600}
                storageKey="fishki-sidebar-width"
              >
                <Box sx={{ 
                  height: '100%', 
                  overflowY: 'auto',
                  overflowX: 'hidden'
                }}>
                  <PageBrowser
                    onFileSelect={handleFileSelect}
                    selectedFile={location.pathname.replace(/^\/(?:page|edit)\//, '')}
                    refreshTrigger={refreshTrigger}
                    onCreatePage={handleCreateInFolder}
                    hasUnsavedChanges={blockNavigation}
                  />
                </Box>
              </ResizablePanel>
            </Box>
          </Box>
        )}

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: '100%',
            transition: 'margin-left 0.2s',
            bgcolor: 'background.default',
            marginLeft: drawerOpen ? 'var(--sidebar-width, 300px)' : 0,
          }}
        >
          <Toolbar /> {/* Spacer to push content below AppBar */}
          
          {appLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : !wikiPathSet ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="info">
                Please configure your wiki path to continue.
              </Alert>
              {errorMessage && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errorMessage}
                </Alert>
              )}
            </Box>
          ) : (
            <Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            }>
              <Routes>
                <Route path="/page/*" element={<ViewPage onPageDeleted={handlePageDeleted} />} />
                <Route path="/edit/*" element={<EditPage onPageCreated={handlePageCreated} />} />
                <Route path="/*" element={<ViewPage onPageDeleted={handlePageDeleted} />} />
              </Routes>
            </Suspense>
          )}
        </Box>

        {/* Setup Wizard */}
        <SetupWizard 
          open={setupWizardOpen} 
          onComplete={handleSetupComplete} 
        />

        {/* Navigation components */}
        <NavigationBlocker />
        <UnsavedChangesDialog
          open={!!pendingLocation}
          onContinue={confirmNavigation}
          onCancel={cancelNavigation}
        />
        
        {/* New Page Dialog */}
        <NewPageDialog
          open={newPageDialogOpen}
          folderPath={currentFolderPath}
          onClose={() => setNewPageDialogOpen(false)}
          onConfirm={handleNewPageConfirm}
        />
      </Box>
    </MuiThemeProvider>
  );
}

function App() {
  return <AppContent />;
}

export default App;
