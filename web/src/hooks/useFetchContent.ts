import { useState, useEffect } from 'react';

const useFetchContent = (filename: string) => {
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/load?filename=${filename}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load page');
        }
        return response.text();
      })
      .then((text: string) => {
        setContent(text);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filename]);

  return { content, error, loading };
};

export default useFetchContent;
