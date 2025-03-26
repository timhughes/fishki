export interface FileInfo {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileInfo[];
}

export interface FileTreeProps {
  files: FileInfo[];
  level?: number;
  onSelect?: () => void;
}
