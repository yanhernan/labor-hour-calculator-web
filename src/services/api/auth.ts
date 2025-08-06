import { apiClient } from './base';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User,
  ApiResponse 
} from './types';

export class AuthService {
  // Login user (used by NextAuth credentials provider)
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', credentials);
  }

  // Register new user
  static async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    return apiClient.post<ApiResponse<User>>('/auth/register', userData);
  }

  // Refresh access token
  static async refreshToken(refreshToken: string): Promise<{ token: string; expiresIn: number }> {
    return apiClient.post<{ token: string; expiresIn: number }>('/auth/refresh', {
      refreshToken
    });
  }

  // Logout (invalidate token on server)
  static async logout(): Promise<ApiResponse<null>> {
    return apiClient.post<ApiResponse<null>>('/auth/logout');
  }

  // Request password reset
  static async requestPasswordReset(email: string): Promise<ApiResponse<null>> {
    return apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email });
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string): Promise<ApiResponse<null>> {
    return apiClient.post<ApiResponse<null>>('/auth/reset-password', {
      token,
      password: newPassword
    });
  }

  // Change password (requires current password)
  static async changePassword(
    currentPassword: string, 
    newPassword: string
  ): Promise<ApiResponse<null>> {
    return apiClient.post<ApiResponse<null>>('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  // Verify email address
  static async verifyEmail(token: string): Promise<ApiResponse<null>> {
    return apiClient.post<ApiResponse<null>>('/auth/verify-email', { token });
  }

  // Resend email verification
  static async resendEmailVerification(): Promise<ApiResponse<null>> {
    return apiClient.post<ApiResponse<null>>('/auth/resend-verification');
  }

  // Get current user profile
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<ApiResponse<User>>('/auth/me');
  }

  // Update current user profile
  static async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put<ApiResponse<User>>('/auth/profile', updates);
  }
}

export default AuthService;