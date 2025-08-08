/**
 * @deprecated Use the new API services in /src/services/api instead
 * This file is kept for backward compatibility
 */

// Re-export the new API services for backward compatibility
export { apiClient as authenticatedFetch } from '@/lib/services/api/base';
export { apiClient } from '@/lib/services/api/base';

// Legacy helper functions - these now use the new API client
export async function apiGet(endpoint: string): Promise<any> {
  const { apiClient } = await import('@/lib/services/api/base');
  return apiClient.get(endpoint);
}

export async function apiPost(endpoint: string, data: any): Promise<any> {
  const { apiClient } = await import('@/lib/services/api/base');
  return apiClient.post(endpoint, data);
}

export async function apiPut(endpoint: string, data: any): Promise<any> {
  const { apiClient } = await import('@/lib/services/api/base');
  return apiClient.put(endpoint, data);
}

export async function apiDelete(endpoint: string): Promise<any> {
  const { apiClient } = await import('@/lib/services/api/base');
  return apiClient.delete(endpoint);
}