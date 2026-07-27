class ApiError extends Error {
  statusCode: number;

  isOperational: boolean;

  errorCode?: string;

  override stack?: string;

  constructor(statusCode: number, message: string, isOperational = true, stack = '', errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
