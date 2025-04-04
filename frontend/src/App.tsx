import React from 'react';
import { PageBrowser } from './components/PageBrowser';
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
    <div className="h-screen flex flex-col sm:flex-row bg-gray-50">
      <div className="w-full sm:w-80 md:w-96 border-r border-gray-200 bg-white shadow-sm">
        <PageBrowser
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
        />
      </div>
      <main className="flex-1 overflow-auto bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {selectedFile && (
            isEditing ? (
              <div className="bg-white rounded-lg shadow-sm">
                <MarkdownEditor
                  filePath={selectedFile}
                  initialContent={currentContent}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm">
                <MarkdownViewer
                  filePath={selectedFile}
                  onEdit={handleEdit}
                />
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
