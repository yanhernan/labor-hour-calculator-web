import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const { data: session } = useSession();
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const makeRequest = useCallback(async (
    endpoint: string,
    requestOptions: RequestInit = {}
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://your-api-domain.com/api';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...requestOptions.headers,
      };

      // Add Authorization header if we have an access token
      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
      }

      const response = await fetch(`${apiUrl}${endpoint}`, {
        ...requestOptions,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      setState(prev => ({ ...prev, data, loading: false }));
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      throw error;
    }
  }, [session, options]);

  const get = useCallback((endpoint: string) => {
    return makeRequest(endpoint, { method: 'GET' });
  }, [makeRequest]);

  const post = useCallback((endpoint: string, data: any) => {
    return makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  const put = useCallback((endpoint: string, data: any) => {
    return makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  const del = useCallback((endpoint: string) => {
    return makeRequest(endpoint, { method: 'DELETE' });
  }, [makeRequest]);

  return {
    ...state,
    get,
    post,
    put,
    delete: del,
    makeRequest,
  };
}