/**
 * Unit tests for error handling utilities
 */

import {
  createApiError,
  createApiResponse,
  handleApiError,
  getErrorMessage,
  logError,
  validateApiResponse,
  retryOperation,
  isApiError,
  ErrorCodes,
  ErrorMessages,
} from '../error-handling'

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createApiError', () => {
    it('should create an API error with all fields', () => {
      const error = createApiError('Test error', 'TEST_CODE', 400, { field: 'value' })
      
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error.status).toBe(400)
      expect(error.details).toEqual({ field: 'value' })
      expect(error.timestamp).toBeDefined()
    })

    it('should create an API error with minimal fields', () => {
      const error = createApiError('Simple error')
      
      expect(error.message).toBe('Simple error')
      expect(error.code).toBeUndefined()
      expect(error.status).toBeUndefined()
      expect(error.details).toBeUndefined()
      expect(error.timestamp).toBeDefined()
    })
  })

  describe('createApiResponse', () => {
    it('should create a successful API response', () => {
      const response = createApiResponse(true, { data: 'test' }, undefined, 'Success')
      
      expect(response.success).toBe(true)
      expect(response.data).toEqual({ data: 'test' })
      expect(response.error).toBeUndefined()
      expect(response.message).toBe('Success')
    })

    it('should create an error API response', () => {
      const error = createApiError('Test error')
      const response = createApiResponse(false, undefined, error)
      
      expect(response.success).toBe(false)
      expect(response.data).toBeUndefined()
      expect(response.error).toEqual(error)
    })
  })

  describe('handleApiError', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error message')
      const response = handleApiError(error)
      
      expect(response.success).toBe(false)
      expect(response.error?.message).toBe('Test error message')
      expect(response.error?.code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR)
      expect(mockConsoleError).toHaveBeenCalled()
    })

    it('should handle database errors', () => {
      const error = new Error('PGRST database error')
      const response = handleApiError(error)
      
      expect(response.success).toBe(false)
      expect(response.error?.message).toBe(ErrorMessages[ErrorCodes.DATABASE_ERROR])
      expect(response.error?.code).toBe(ErrorCodes.DATABASE_ERROR)
    })

    it('should handle fetch errors', () => {
      const error = new Error('fetch failed')
      const response = handleApiError(error)
      
      expect(response.success).toBe(false)
      expect(response.error?.message).toBe(ErrorMessages[ErrorCodes.EXTERNAL_SERVICE_ERROR])
      expect(response.error?.code).toBe(ErrorCodes.EXTERNAL_SERVICE_ERROR)
    })

    it('should handle string errors', () => {
      const response = handleApiError('String error message')
      
      expect(response.success).toBe(false)
      expect(response.error?.message).toBe('String error message')
      expect(response.error?.code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR)
    })

    it('should handle unknown errors', () => {
      const response = handleApiError({ unknown: 'error' })
      
      expect(response.success).toBe(false)
      expect(response.error?.message).toBe(ErrorMessages[ErrorCodes.INTERNAL_SERVER_ERROR])
      expect(response.error?.code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR)
    })
  })

  describe('getErrorMessage', () => {
    it('should extract message from API error', () => {
      const error = createApiError('Custom error message')
      const message = getErrorMessage(error)
      
      expect(message).toBe('Custom error message')
    })

    it('should handle string errors', () => {
      const message = getErrorMessage('String error')
      
      expect(message).toBe('String error')
    })

    it('should handle unknown errors', () => {
      const message = getErrorMessage({ unknown: 'error' })
      
      expect(message).toBe(ErrorMessages[ErrorCodes.INTERNAL_SERVER_ERROR])
    })

    it('should handle null/undefined errors', () => {
      expect(getErrorMessage(null)).toBe(ErrorMessages[ErrorCodes.INTERNAL_SERVER_ERROR])
      expect(getErrorMessage(undefined)).toBe(ErrorMessages[ErrorCodes.INTERNAL_SERVER_ERROR])
    })
  })

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new Error('Test error')
      logError(error, 'Test context', { additional: 'data' })
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Application Error:',
        expect.objectContaining({
          context: 'Test context',
          error: expect.objectContaining({
            name: 'Error',
            message: 'Test error',
            stack: expect.any(String),
          }),
          additionalData: { additional: 'data' },
          timestamp: expect.any(String),
        })
      )
    })

    it('should log non-Error objects', () => {
      logError('String error', 'Test context')
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Application Error:',
        expect.objectContaining({
          context: 'Test context',
          error: 'String error',
          timestamp: expect.any(String),
        })
      )
    })
  })

  describe('validateApiResponse', () => {
    it('should return data for successful response', () => {
      const response = createApiResponse(true, { test: 'data' })
      const result = validateApiResponse(response)
      
      expect(result).toEqual({ test: 'data' })
    })

    it('should throw for unsuccessful response', () => {
      const error = createApiError('Test error')
      const response = createApiResponse(false, undefined, error)
      
      expect(() => validateApiResponse(response)).toThrow('Test error')
    })

    it('should throw for response without data', () => {
      const response = createApiResponse(true)
      
      expect(() => validateApiResponse(response)).toThrow('No data returned from API')
    })
  })

  describe('retryOperation', () => {
    it('should succeed on first try', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      
      const result = await retryOperation(operation, 3, 100)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success')
      
      const result = await retryOperation(operation, 3, 10)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should throw after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'))
      
      await expect(retryOperation(operation, 2, 10)).rejects.toThrow('Always fails')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should use default parameters', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      
      const result = await retryOperation(operation)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })
  })

  describe('isApiError', () => {
    it('should identify API errors', () => {
      const apiError = createApiError('Test error')
      
      expect(isApiError(apiError)).toBe(true)
    })

    it('should reject non-API errors', () => {
      expect(isApiError('string')).toBe(false)
      expect(isApiError(123)).toBe(false)
      expect(isApiError(null)).toBe(false)
      expect(isApiError(undefined)).toBe(false)
      expect(isApiError({})).toBe(false)
      expect(isApiError({ notMessage: 'test' })).toBe(false)
    })

    it('should handle Error objects', () => {
      const error = new Error('Test')
      // Error objects have a message property so they pass the type guard
      expect(isApiError(error)).toBe(true)
    })
  })

  describe('ErrorCodes and ErrorMessages', () => {
    it('should have corresponding messages for all error codes', () => {
      Object.values(ErrorCodes).forEach(code => {
        expect(ErrorMessages[code]).toBeDefined()
        expect(typeof ErrorMessages[code]).toBe('string')
        expect(ErrorMessages[code].length).toBeGreaterThan(0)
      })
    })

    it('should have user-friendly error messages', () => {
      expect(ErrorMessages[ErrorCodes.UNAUTHORIZED]).toContain('log in')
      expect(ErrorMessages[ErrorCodes.VALIDATION_ERROR]).toContain('check your input')
      expect(ErrorMessages[ErrorCodes.INTERNAL_SERVER_ERROR]).toContain('try again')
    })
  })
})
