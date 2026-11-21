export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number = 500, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export function handleApiError(error: any): string {
  if (error instanceof ApiError) {
    if (typeof error.data?.message === 'string') {
      return error.data.message;
    }
    if (Array.isArray(error.data?.message)) {
      return error.data.message.join(', ');
    }
    return error.message;
  }
  return error?.message || 'An unexpected error occurred. Please try again.';
}
