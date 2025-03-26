export interface ApiError {
  message: string;
  code?: string;
}

export interface FileOperation {
  filename: string;
  content: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface FileContent {
  content: string;
}
