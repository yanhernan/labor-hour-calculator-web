
import { AuthService } from './auth';
import { UserService } from './users';
import { ClientService } from './clients';

export * from './types';

export const api = {
  auth: AuthService,
  users: UserService,
  clients: ClientService,
};

// Default export for convenience
export default api;