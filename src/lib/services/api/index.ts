
import { AuthService } from './auth';

export * from './types';

export const api = {
  auth: AuthService,
};

// Default export for convenience
export default api;