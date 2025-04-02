import React from 'react';
import { FileBrowser } from './components/FileBrowser';
import { MarkdownViewer } from './components/MarkdownViewer';
import { MarkdownEditor } from './components/MarkdownEditor';
import { api } from './api/client';

function App() {
  const [selectedFile, setSelectedFile] = React.useState<string>();
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentContent, setCurrentContent] = React.useState<string>('');

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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <FileBrowser
        onFileSelect={handleFileSelect}
        selectedFile={selectedFile}
      />
      <main style={{
        overflow: 'auto',
        backgroundColor: '#f8f9fa'
      }}>
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
      </main>
    </div>
  );
}

export default App;
