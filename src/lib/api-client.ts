/**
 * Standardized API Client for Singapore Legal Help Platform
 * Provides consistent error handling, request/response formatting, and retry logic
 */

import { ApiResponse, handleApiError, logError, retryOperation } from './error-handling';
import { validateWithSchema } from './validation-schemas';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  validateResponse?: z.ZodSchema;
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor(baseUrl: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
    this.defaultTimeout = 10000; // 10 seconds
  }

  /**
   * Makes an HTTP request with standardized error handling
   */
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = 1,
      validateResponse,
    } = config;

    const url = this.baseUrl + endpoint;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    try {
      const response = await retryOperation(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const fetchResponse = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          return fetchResponse;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }, retries);

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `HTTP ${response.status}` };
        }

        logError(errorData, `API Request Failed: ${method} ${url}`, {
          status: response.status,
          statusText: response.statusText,
        });

        return {
          success: false,
          error: {
            message: errorData.message || `Request failed with status ${response.status}`,
            code: errorData.code,
            status: response.status,
            details: errorData,
          },
        };
      }

      // Parse response
      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (error) {
        logError(error, `Failed to parse JSON response: ${method} ${url}`);
        return {
          success: false,
          error: {
            message: 'Invalid response format',
            code: 'INVALID_RESPONSE',
            status: 500,
          },
        };
      }

      // Validate response if schema provided
      if (validateResponse && data) {
        const validation = validateWithSchema(validateResponse, data);
        if (!validation.success) {
          logError(validation.errors, `Response validation failed: ${method} ${url}`);
          return {
            success: false,
            error: {
              message: 'Invalid response data',
              code: 'VALIDATION_ERROR',
              status: 500,
              details: { validationErrors: validation.errors },
            },
          };
        }
        data = validation.data;
      }

      return {
        success: true,
        data,
      };

    } catch (error) {
      logError(error, `API Request Error: ${method} ${url}`);
      return handleApiError(error);
    }
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.request<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile<T = any>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ success: true, data: response });
            } else {
              resolve({
                success: false,
                error: {
                  message: response.message || 'Upload failed',
                  status: xhr.status,
                },
              });
            }
          } catch (error) {
            resolve({
              success: false,
              error: {
                message: 'Failed to parse upload response',
                status: xhr.status,
              },
            });
          }
        });

        xhr.addEventListener('error', () => {
          resolve({
            success: false,
            error: {
              message: 'Upload failed',
              status: xhr.status,
            },
          });
        });

        xhr.open('POST', this.baseUrl + endpoint);
        
        // Add default headers except Content-Type (let browser set it for FormData)
        Object.entries(this.defaultHeaders).forEach(([key, value]) => {
          if (key.toLowerCase() !== 'content-type') {
            xhr.setRequestHeader(key, value);
          }
        });

        xhr.send(formData);
      });

    } catch (error) {
      logError(error, `File Upload Error: ${endpoint}`);
      return handleApiError(error);
    }
  }

  /**
   * Set authorization header
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authorization header
   */
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Update default headers
   */
  setHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }
}

// Create default API client instance
export const apiClient = new ApiClient('/api');

// Specialized API clients for different services
export const templateApi = {
  getTemplates: (params?: Record<string, any>) => 
    apiClient.get('/admin/templates', params),
  
  getTemplate: (id: string) => 
    apiClient.get(`/admin/templates?id=${id}`),
  
  createTemplate: (data: any) => 
    apiClient.post('/admin/templates', data),
  
  updateTemplate: (id: string, data: any) => 
    apiClient.put(`/admin/templates/${id}`, data),
  
  deleteTemplate: (id: string) => 
    apiClient.delete(`/admin/templates/${id}`),
  
  generateDocument: (data: any) => 
    apiClient.post('/admin/templates/generate', data),
};

export const variableApi = {
  getVariables: (params?: Record<string, any>) => 
    apiClient.get('/admin/variables', params),
  
  createVariable: (data: any) => 
    apiClient.post('/admin/variables', data),
  
  updateVariable: (id: string, data: any) => 
    apiClient.put(`/admin/variables/${id}`, data),
  
  deleteVariable: (id: string) => 
    apiClient.delete(`/admin/variables/${id}`),
};

export const searchApi = {
  globalSearch: (params: Record<string, any>) => 
    apiClient.get('/search/global', params),
  
  getSuggestions: (params: Record<string, any>) =>
    apiClient.get('/search/suggestions', params),
};

// =====================================================
// Authentication Helper Functions
// =====================================================

/**
 * Get authentication token for API calls
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch (error) {
    console.error('Failed to get auth token:', error)
    return null
  }
}

/**
 * Make authenticated API call
 */
export async function makeAuthenticatedRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Authentication required')
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  }

  return fetch(endpoint, {
    ...options,
    headers,
  })
}
