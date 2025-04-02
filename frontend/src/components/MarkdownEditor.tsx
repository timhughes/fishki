import React from 'react';
import { api } from '../api/client';

interface MarkdownEditorProps {
  filePath: string;
  initialContent: string;
  onSave: () => void;
  onCancel: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  filePath,
  initialContent,
  onSave,
  onCancel,
}) => {
  const [content, setContent] = React.useState(initialContent);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.save(filePath, content);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '8px',
        marginBottom: '16px'
      }}>
        <button 
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          disabled={saving}
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1
          }}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {error && (
        <div style={{ 
          color: '#dc3545', 
          marginBottom: '16px', 
          padding: '8px', 
          backgroundColor: '#f8d7da', 
          borderRadius: '4px' 
        }}>
          {error}
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: '100%',
          minHeight: '500px',
          padding: '16px',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          resize: 'vertical'
        }}
        disabled={saving}
      />
    </div>
  );
};
