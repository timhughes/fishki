import React from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Box, AppBar, Toolbar, Typography, IconButton, Breadcrumbs, Link } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Edit as EditIcon, Folder as FolderIcon, Description as DescriptionIcon } from '@mui/icons-material';
import { PageBrowser } from './components/PageBrowser';
import { MarkdownViewer } from './components/MarkdownViewer';
import { MarkdownEditor } from './components/MarkdownEditor';
import { api } from './api/client';

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

const PathBreadcrumbs = ({ path }: { path: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname.startsWith('/edit/');
  const parts = path.split('/');

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ ml: 2, flex: 1, color: 'white' }}>
      {parts.map((part, index) => {
        const currentPath = parts.slice(0, index + 1).join('/');
        const isLast = index === parts.length - 1;

        return isLast ? (
          <Box key={part} sx={{ display: 'flex', alignItems: 'center' }}>
            <DescriptionIcon sx={{ mr: 0.5, fontSize: 20 }} />
            <Typography color="white" sx={{ display: 'flex', alignItems: 'center' }}>
              {part.replace(/\.md$/, '')}
              {isEditMode && (
                <EditIcon sx={{ ml: 1, fontSize: 16 }} />
              )}
            </Typography>
          </Box>
        ) : part ? (
          <Link
            key={part}
            component="button"
            onClick={() => navigate(`/page/${currentPath}`)}
            sx={{ 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            <FolderIcon sx={{ mr: 0.5, fontSize: 20 }} />
            {part}
          </Link>
        ) : null;
      })}
    </Breadcrumbs>
  );
};

// Route components
const ViewPage = () => {
  const { '*': path } = useParams();
  const navigate = useNavigate();
  
  const handleEdit = () => {
    navigate(`/edit/${path}`);
  };

  return (
    <MarkdownViewer
      filePath={path || ''}
      onEdit={handleEdit}
    />
  );
};

const EditPage = () => {
  const { '*': path } = useParams();
  const navigate = useNavigate();
  const [initialContent, setInitialContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadContent = async () => {
      try {
        const content = await api.load(path || '');
        setInitialContent(content);
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [path]);

  const handleSave = () => {
    navigate(`/page/${path}`);
  };

  const handleCancel = () => {
    navigate(`/page/${path}`);
  };

  if (loading) {
    return null;
  }

  return (
    <MarkdownEditor
      filePath={path || ''}
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
  const { '*': currentPath } = useParams();

  const handleFileSelect = (path: string) => {
    if (location.pathname.startsWith('/edit/')) {
      navigate(`/edit/${path}`);
    } else {
      navigate(`/page/${path}`);
    }
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
            <Typography variant="h6" noWrap component="div" sx={{ mr: 2 }}>
              Fishki Wiki
            </Typography>
            {currentPath && <PathBreadcrumbs path={currentPath} />}
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
            <Route path="/page/*" element={<ViewPage />} />
            <Route path="/edit/*" element={<EditPage />} />
            <Route path="/*" element={<ViewPage />} />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
