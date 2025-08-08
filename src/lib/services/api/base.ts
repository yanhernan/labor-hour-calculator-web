import envConfig from '@/lib/env/config';
import { getSession } from 'next-auth/react';

// API configuration
export const API_CONFIG = {
  timeout: 10000, // 10 seconds
  retries: 3,
};

// API Error class for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Base API client class
export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Get authentication headers
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await getSession();
    const headers: Record<string, string> = { ...this.defaultHeaders };

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    return headers;
  }

  // Make HTTP request with retry logic
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return response;
    } catch (error) {
      // Retry logic for network errors
      if (retryCount < API_CONFIG.retries && error instanceof Error && error.name !== 'ApiError') {
        console.warn(`API request failed, retrying... (${retryCount + 1}/${API_CONFIG.retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return this.makeRequest(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  // GET request
  async get<T = any>(endpoint: string): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      method: 'GET',
    });
    return response.json();
  }

  // POST request
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  // PUT request
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  // PATCH request
  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  // DELETE request
  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      method: 'DELETE',
    });
    
    // Handle empty response bodies for DELETE requests
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      return {} as T;
    }
  }

  // Upload file
  async upload<T = any>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const session = await getSession();
    const headers: Record<string, string> = {};

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      body: formData,
      headers, // Don't set Content-Type for FormData, let browser set it
    });

    return response.json();
  }
}

// Create and export a default API client instance
export const apiClient = new ApiClient(envConfig.primaryApiUrl);