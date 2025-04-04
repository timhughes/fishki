import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { PageBrowser } from './components/PageBrowser';
import { MarkdownViewer } from './components/MarkdownViewer';
import { MarkdownEditor } from './components/MarkdownEditor';
import { api } from './api/client';

// Create a theme instance
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

function App() {
  const [selectedFile, setSelectedFile] = React.useState<string>();
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentContent, setCurrentContent] = React.useState<string>('');
  const [drawerOpen, setDrawerOpen] = React.useState(true);

  const handleFileSelect = async (path: string) => {
    try {
      setSelectedFile(path);
      setIsEditing(false);
      const content = await api.load(path);
      setCurrentContent(content);
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
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
            selectedFile={selectedFile}
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
          {selectedFile && (
            isEditing ? (
              <MarkdownEditor
                filePath={selectedFile}
                initialContent={currentContent}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <MarkdownViewer
                filePath={selectedFile}
                onEdit={handleEdit}
              />
            )
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
