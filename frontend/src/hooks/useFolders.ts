import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { FileInfo } from '../types/api';
import logger from '../utils/logger';

export interface UseFoldersResult {
  folders: string[];
  loading: boolean;
  error: string;
}

/**
 * Custom hook to fetch and manage folder data
 * @param shouldFetch - Whether to fetch folders (typically tied to dialog open state)
 * @returns Object containing folders array, loading state, and error message
 */
export function useFolders(shouldFetch: boolean): UseFoldersResult {
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    const fetchFolders = async () => {
      if (!shouldFetch) return;
      
      try {
        setLoading(true);
        setError('');
        
        const fileTree = await api.getFiles();
        const folderPaths = extractFolderPaths(fileTree);
        
        // Add root directory
        folderPaths.unshift('');
        
        if (isMounted) {
          setFolders(folderPaths);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load folders');
          logger.error('Failed to load folders', err, 'useFolders');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchFolders();
    
    return () => {
      isMounted = false;
    };
  }, [shouldFetch]);

  return { folders, loading, error };
}

// Recursive function to extract folder paths from file tree
function extractFolderPaths(items: FileInfo[]): string[] {
  let paths: string[] = [];
  
  // Check if we have a repository folder at the root
  if (items.length > 0 && items[0].type === 'folder' && items[0].children) {
    // Process each child of the repository folder
    for (const child of items[0].children) {
      if (child.type === 'folder') {
        // Add this folder
        paths.push(child.path);
        
        // Process subfolders recursively
        if (child.children) {
          for (const subChild of child.children) {
            if (subChild.type === 'folder') {
              paths.push(subChild.path);
              // Continue recursion if needed
              addSubfolders(subChild, paths);
            }
          }
        }
      }
    }
  }
  
  return paths;
}

// Helper function to add all subfolders recursively
function addSubfolders(folder: FileInfo, paths: string[]): void {
  if (folder.children) {
    for (const child of folder.children) {
      if (child.type === 'folder') {
        paths.push(child.path);
        addSubfolders(child, paths);
      }
    }
  }
}
