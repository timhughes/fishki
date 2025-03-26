import { ApiError as ApiErrorType, ApiResponse, FileOperation, FileContent } from '../types/api';
import { FileInfo } from '../types/files';

const API_ENDPOINTS = {
  SAVE_FILE: '/api/save',
  LOAD_FILE: '/api/load',
} as const;

export class ApiRequestError extends Error implements ApiErrorType {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage: string;
    try {
      const error = await response.json();
      errorMessage = error.message || 'An unknown error occurred';
    } catch {
      errorMessage = await response.text();
    }
    throw new ApiRequestError(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  // For text responses, wrap in the expected interface
  const text = await response.text();
  if (typeof text === 'string' && response.headers.get('content-type')?.includes('text/plain')) {
    return { content: text } as T;
  }

  throw new ApiRequestError('Unexpected response format');
}

export async function saveFile(operation: FileOperation, signal?: AbortSignal): Promise<void> {
  const response = await fetch(API_ENDPOINTS.SAVE_FILE, {
    signal,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(operation),
  });
  
  await handleResponse(response);
}

export async function loadFile(filename: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch(`${API_ENDPOINTS.LOAD_FILE}?filename=${encodeURIComponent(filename)}`, { signal });
  const data = await handleResponse<FileContent>(response);
  return data.content;
}

interface FileListResponse {
  files: FileInfo[];
}

export async function listFiles(): Promise<FileInfo[]> {
  const response = await fetch('/api/files');
  const data = await handleResponse<FileListResponse>(response);
  return data.files;
}

export function createAbortController(): AbortController {
  return new AbortController();
}
