import React from 'react';
import { FileInfo } from '../types/api';
import { api } from '../api/client';

interface FileBrowserProps {
  onFileSelect: (path: string) => void;
  selectedFile?: string;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({ onFileSelect, selectedFile }) => {
  const [files, setFiles] = React.useState<FileInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    const loadFiles = async () => {
      try {
        const fileTree = await api.getFiles();
        setFiles(fileTree);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load files');
        setLoading(false);
      }
    };

    loadFiles();
  }, []);

  const renderFileTree = (items: FileInfo[], level = 0) => {
    return items.map((item) => (
      <div key={item.path} style={{ paddingLeft: `${level * 20}px` }}>
        <div
          className={`file-item ${selectedFile === item.path ? 'selected' : ''}`}
          onClick={() => item.type === 'file' && onFileSelect(item.path)}
          style={{
            cursor: item.type === 'file' ? 'pointer' : 'default',
            padding: '4px 8px',
            backgroundColor: selectedFile === item.path ? '#e6f3ff' : 'transparent',
            borderRadius: '4px',
            marginBottom: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {item.type === 'folder' ? '📁' : '📄'} {item.type === 'folder' ? item.name : item.name.replace(/\.md$/, '')}
        </div>
        {item.children && renderFileTree(item.children, level + 1)}
      </div>
    ));
  };

  if (loading) {
    return <div>Loading files...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{
      padding: '16px',
      borderRight: '1px solid #eee',
      height: '100%',
      overflowY: 'auto'
    }}>
      {renderFileTree(files)}
    </div>
  );
};
