import { apiClient } from './base';
import {
  LoginRequest,
  LoggedResponse,
} from './types';

export class AuthService {
  // Login user (used by NextAuth credentials provider)
  static async login(credentials: LoginRequest): Promise<LoggedResponse> {
    return apiClient.post<LoggedResponse>('/api/v1/auth/login', credentials);
  }

}

export default AuthService;