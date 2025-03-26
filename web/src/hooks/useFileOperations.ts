import { useState, useCallback } from 'react';
import { saveFile as apiSaveFile, loadFile as apiLoadFile } from '../services/api';

interface FileOperations {
  saveFile: (filename: string, content: string) => Promise<void>;
  loadFile: (filename: string) => Promise<string | null>;
  createFile: (filename: string, content: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const useFileOperations = (): FileOperations => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    setError(message);
    return null;
  }, []);

  const saveFile = useCallback(async (filename: string, content: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await apiSaveFile({ filename, content });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadFile = useCallback(async (filename: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiLoadFile(filename);
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createFile = useCallback(async (filename: string, content: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await apiSaveFile({ filename, content });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return { saveFile, loadFile, createFile, loading, error };
};

export default useFileOperations;
