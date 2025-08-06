// Export all API services and types
export { apiClient, ApiClient, ApiError, API_CONFIG } from './base';

// Export all service classes
export { AuthService } from './auth';
export { UserService } from './users';
export { ClientService } from './clients';

// Export all types
export * from './types';

// Create service instances for easier access
export const api = {
  auth: AuthService,
  users: UserService,
  clients: ClientService,
};

// Default export for convenience
export default api;