/**
 * Custom API error class for handling API errors with status codes
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
    
    // This is needed for proper instanceof checks in TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
