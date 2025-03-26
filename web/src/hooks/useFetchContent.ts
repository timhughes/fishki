import { useState, useEffect, useCallback } from 'react';
import { loadFile, createAbortController } from '../services/api';

interface FetchContentResult {
  content: string;
  error: string | null;
  loading: boolean;
}

const useFetchContent = (filename: string): FetchContentResult => {
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const handleError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    setError(message);
  }, []);

  useEffect(() => {
    const abortController = createAbortController();

    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const content = await loadFile(filename, abortController.signal);
        setContent(content);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        handleError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();

    return () => {
      abortController.abort();
    };
  }, [filename, handleError]);

  return { content, error, loading };
};

export default useFetchContent;
