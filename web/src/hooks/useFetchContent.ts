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
    console.error('Error fetching content:', err);
    setError(message);
  }, []);

  useEffect(() => {
    console.log('Fetching content for:', filename); // Debug log
    const abortController = createAbortController();

    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Making API request for:', filename); // Debug log
        const content = await loadFile(filename, abortController.signal);
        console.log('Received content:', content ? content.substring(0, 100) + '...' : 'empty'); // Debug log
        setContent(content);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Request aborted for:', filename); // Debug log
          return;
        }
        handleError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();

    return () => {
      console.log('Cleaning up fetch for:', filename); // Debug log
      abortController.abort();
    };
  }, [filename, handleError]);

  return { content, error, loading };
};

export default useFetchContent;
