export interface FileInfo {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileInfo[];
}

export interface FilesResponse {
  files: FileInfo[];
}

export interface InitRequest {
  path: string;
}

export interface SaveRequest {
  filename: string;
  content: string;
}

export interface RenderRequest {
  markdown: string;
}

// Error response from the server
export interface ApiError {
  message: string;
  status: number;
}
