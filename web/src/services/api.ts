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
    const error = await response.json().catch(() => ({
      message: 'An unknown error occurred'
    }));
    throw new ApiRequestError(error.message, error.code);
  }
  
  return response.json();
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

export async function listFiles(): Promise<FileInfo[]> {
  const response = await fetch('/api/files');
  const data = await handleResponse<FileInfo[]>(response);
  return data;
}

export function createAbortController(): AbortController {
  return new AbortController();
}
