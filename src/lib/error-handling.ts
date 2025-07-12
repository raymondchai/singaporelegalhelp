/**
 * Comprehensive Error Handling Utilities for Singapore Legal Help Platform
 * Provides standardized error handling, logging, and user-friendly error messages
 */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
  timestamp?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

/**
 * Standard error codes for the application
 */
export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Business logic errors
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  
  // System errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // Document generation errors
  DOCUMENT_GENERATION_FAILED: 'DOCUMENT_GENERATION_FAILED',
  TEMPLATE_PROCESSING_ERROR: 'TEMPLATE_PROCESSING_ERROR',
  INVALID_TEMPLATE_FORMAT: 'INVALID_TEMPLATE_FORMAT',
} as const;

/**
 * User-friendly error messages for different error codes
 */
export const ErrorMessages: Record<string, string> = {
  [ErrorCodes.UNAUTHORIZED]: 'Please log in to access this feature.',
  [ErrorCodes.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ErrorCodes.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  
  [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCodes.INVALID_INPUT]: 'The information provided is not valid.',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
  
  [ErrorCodes.TEMPLATE_NOT_FOUND]: 'The requested template could not be found.',
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 'You need a higher subscription tier to access this template.',
  [ErrorCodes.SUBSCRIPTION_REQUIRED]: 'This feature requires an active subscription.',
  
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
  [ErrorCodes.DATABASE_ERROR]: 'Unable to process your request. Please try again.',
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'External service is temporarily unavailable.',
  
  [ErrorCodes.DOCUMENT_GENERATION_FAILED]: 'Failed to generate document. Please check your input and try again.',
  [ErrorCodes.TEMPLATE_PROCESSING_ERROR]: 'Error processing template. Please contact support.',
  [ErrorCodes.INVALID_TEMPLATE_FORMAT]: 'The template format is not supported.',
};

/**
 * Creates a standardized API error
 */
export function createApiError(
  message: string,
  code?: string,
  status?: number,
  details?: Record<string, any>
): ApiError {
  return {
    message,
    code,
    status,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a standardized API response
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: ApiError,
  message?: string
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    message,
  };
}

/**
 * Handles and formats errors for API responses
 */
export function handleApiError(error: unknown): ApiResponse {
  console.error('API Error:', error);

  // Handle known error types
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('PGRST')) {
      return createApiResponse(false, undefined, createApiError(
        ErrorMessages[ErrorCodes.DATABASE_ERROR],
        ErrorCodes.DATABASE_ERROR,
        500
      ));
    }

    if (error.message.includes('fetch')) {
      return createApiResponse(false, undefined, createApiError(
        ErrorMessages[ErrorCodes.EXTERNAL_SERVICE_ERROR],
        ErrorCodes.EXTERNAL_SERVICE_ERROR,
        503
      ));
    }

    return createApiResponse(false, undefined, createApiError(
      error.message,
      ErrorCodes.INTERNAL_SERVER_ERROR,
      500
    ));
  }

  // Handle string errors
  if (typeof error === 'string') {
    return createApiResponse(false, undefined, createApiError(
      error,
      ErrorCodes.INTERNAL_SERVER_ERROR,
      500
    ));
  }

  // Default error
  return createApiResponse(false, undefined, createApiError(
    ErrorMessages[ErrorCodes.INTERNAL_SERVER_ERROR],
    ErrorCodes.INTERNAL_SERVER_ERROR,
    500
  ));
}

/**
 * Extracts user-friendly error message from API response
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const apiError = error as ApiError;
    return apiError.message || ErrorMessages[ErrorCodes.INTERNAL_SERVER_ERROR];
  }

  return ErrorMessages[ErrorCodes.INTERNAL_SERVER_ERROR];
}

interface ErrorLogData {
  message: string
  stack?: string
  context?: string
  metadata?: Record<string, any>
  timestamp: string
  url: string
  userAgent: string
  userId?: string
  sessionId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'javascript' | 'api' | 'database' | 'auth' | 'payment' | 'performance' | 'security'
}

class ErrorTracker {
  private errorQueue: ErrorLogData[] = []
  private readonly batchSize = 10
  private readonly flushInterval = 5000 // 5 seconds
  private readonly maxRetries = 3

  constructor() {
    if (typeof window !== 'undefined') {
      // Flush errors periodically
      setInterval(() => this.flushErrors(), this.flushInterval)

      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flushErrors())
    }
  }

  logError(
    error: Error | string,
    context?: string,
    metadata?: Record<string, any>,
    severity: ErrorLogData['severity'] = 'medium',
    category: ErrorLogData['category'] = 'javascript'
  ) {
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorStack = typeof error === 'string' ? undefined : error.stack

    const errorData: ErrorLogData = {
      message: errorMessage,
      stack: errorStack,
      context,
      metadata,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      severity,
      category,
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      let logLevel: 'error' | 'warn' | 'log' = 'log'
      if (severity === 'critical') {
        logLevel = 'error'
      } else if (severity === 'high') {
        logLevel = 'warn'
      }
      console[logLevel](`[${category.toUpperCase()}] ${errorMessage}`, errorData)
    }

    // Add to queue for batch processing
    this.errorQueue.push(errorData)

    // Flush immediately for critical errors
    if (severity === 'critical') {
      this.flushErrors()
    } else if (this.errorQueue.length >= this.batchSize) {
      this.flushErrors()
    }

    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: errorMessage,
        fatal: severity === 'critical',
        custom_parameter_1: category,
        custom_parameter_2: context,
      })
    }
  }

  private async flushErrors() {
    if (this.errorQueue.length === 0) return

    const errors = [...this.errorQueue]
    this.errorQueue = []

    try {
      await this.sendErrors(errors)
    } catch (error) {
      console.error('Failed to send error logs:', error)
      // Re-queue errors for retry (up to max retries)
      this.errorQueue.unshift(...errors)
    }
  }

  private async sendErrors(errors: ErrorLogData[], retryCount = 0): Promise<void> {
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      if (retryCount < this.maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000
        setTimeout(() => this.sendErrors(errors, retryCount + 1), delay)
      } else {
        throw error
      }
    }
  }

  private getCurrentUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined

    try {
      // Try to get user ID from various sources
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.id
      }
    } catch (error) {
      // Ignore errors getting user ID
    }

    return undefined
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'

    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem('sessionId', sessionId)
    }

    return sessionId
  }
}

// Singleton instance
const errorTracker = new ErrorTracker()

/**
 * Enhanced error logging with categorization and severity
 */
export function logError(
  error: unknown,
  context: string,
  additionalData?: Record<string, any>,
  severity: ErrorLogData['severity'] = 'medium',
  category: ErrorLogData['category'] = 'javascript'
): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  errorTracker.logError(errorMessage, context, additionalData, severity, category)
}

// Specialized logging functions
export const logApiError = (error: Error | string, endpoint: string, metadata?: Record<string, any>) => {
  errorTracker.logError(error, `API: ${endpoint}`, metadata, 'high', 'api')
}

export const logDatabaseError = (error: Error | string, query: string, metadata?: Record<string, any>) => {
  errorTracker.logError(error, `Database: ${query}`, metadata, 'high', 'database')
}

export const logAuthError = (error: Error | string, action: string, metadata?: Record<string, any>) => {
  errorTracker.logError(error, `Auth: ${action}`, metadata, 'high', 'auth')
}

export const logPaymentError = (error: Error | string, action: string, metadata?: Record<string, any>) => {
  errorTracker.logError(error, `Payment: ${action}`, metadata, 'critical', 'payment')
}

export const logPerformanceError = (error: Error | string, metric: string, metadata?: Record<string, any>) => {
  errorTracker.logError(error, `Performance: ${metric}`, metadata, 'medium', 'performance')
}

export const logSecurityError = (error: Error | string, threat: string, metadata?: Record<string, any>) => {
  errorTracker.logError(error, `Security: ${threat}`, metadata, 'critical', 'security')
}

/**
 * Validates API response and throws if not successful
 */
export function validateApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error?.message || 'API request failed');
  }

  if (response.data === undefined) {
    throw new Error('No data returned from API');
  }

  return response.data;
}

/**
 * Retry mechanism for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logError(error, `Retry attempt ${attempt}/${maxRetries}`);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Type guard to check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}
