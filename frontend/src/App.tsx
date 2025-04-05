import React from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Box, AppBar, Toolbar, Typography, IconButton, CircularProgress, Alert } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { PageBrowser } from './components/PageBrowser';
import { MarkdownViewer } from './components/MarkdownViewer';
import { MarkdownEditor } from './components/MarkdownEditor';
import { CreatePage } from './components/CreatePage';
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
  const [notFound, setNotFound] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [error, setError] = React.useState<string>();
  
  const handleEdit = () => {
    navigate(`/edit/${path}`);
  };

  const handleCreate = () => {
    navigate(`/edit/${path}`);
  };

  const handleDelete = () => {
    onPageDeleted();
    setNotFound(true);
  };

  React.useEffect(() => {
    // Check if page exists when path changes
    const checkPage = async () => {
      try {
        setChecking(true);
        setError(undefined);
        await api.load(addMdExtension(path || ''));
        setNotFound(false);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes('404')) {
            setNotFound(true);
          } else {
            setError(err.message);
          }
        }
      } finally {
        setChecking(false);
      }
    };

    if (path) {
      checkPage();
    } else {
      setChecking(false);
      setNotFound(false);
      setError(undefined);
    }
  }, [path]);

  if (checking) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!path) {
    return <CreatePage path={''} onCreateClick={handleCreate} />;
  }

  if (notFound) {
    return <CreatePage path={path} onCreateClick={handleCreate} />;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
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

  React.useEffect(() => {
    const loadContent = async () => {
      try {
        const content = await api.load(addMdExtension(path || ''));
        setInitialContent(content);
        setPageExists(true);
      } catch (err) {
        setInitialContent('');
        setPageExists(false);
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

  return (
    <MarkdownEditor
      filePath={addMdExtension(path || '')}
      initialContent={pageExists ? initialContent : `# ${path?.split('/').pop() || 'New Page'}\n\n`}
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

  const handleFileSelect = (path: string) => {
    if (location.pathname.startsWith('/edit/')) {
      navigate(`/edit/${path}`);
    } else {
      navigate(`/page/${path}`);
    }
  };

  const handlePageCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handlePageDeleted = () => {
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
      </Box>
    </ThemeProvider>
  );
}

export default App;
