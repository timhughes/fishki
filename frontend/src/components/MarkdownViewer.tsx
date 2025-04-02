import React from 'react';
import { api } from '../api/client';

interface MarkdownViewerProps {
  filePath: string;
  onEdit: () => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ filePath, onEdit }) => {
  const [content, setContent] = React.useState<string>('');
  const [renderedContent, setRenderedContent] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const fileContent = await api.load(filePath);
        setContent(fileContent);
        const rendered = await api.render(fileContent);
        setRenderedContent(rendered);
        setError(undefined);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    if (filePath) {
      loadContent();
    }
  }, [filePath]);

  if (!filePath) {
    return <div>No file selected</div>;
  }

  if (loading) {
    return <div>Loading content...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        marginBottom: '16px'
      }}>
        <button 
          onClick={onEdit}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Edit
        </button>
      </div>
      <div
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    </div>
  );
};
