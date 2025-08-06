import { apiClient } from './base';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  ApiResponse, 
  PaginatedResponse 
} from './types';

export class UserService {
  // Get all users (admin only)
  static async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }

    const query = searchParams.toString();
    return apiClient.get<PaginatedResponse<User>>(`/users${query ? `?${query}` : ''}`);
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<ApiResponse<User>> {
    return apiClient.get<ApiResponse<User>>(`/users/${userId}`);
  }

  // Create new user (admin only)
  static async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.post<ApiResponse<User>>('/users', userData);
  }

  // Update user (admin only or own profile)
  static async updateUser(userId: string, updates: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.put<ApiResponse<User>>(`/users/${userId}`, updates);
  }

  // Delete user (admin only)
  static async deleteUser(userId: string): Promise<ApiResponse<null>> {
    return apiClient.delete<ApiResponse<null>>(`/users/${userId}`);
  }

  // Activate/Deactivate user (admin only)
  static async toggleUserStatus(userId: string, isActive: boolean): Promise<ApiResponse<User>> {
    return apiClient.patch<ApiResponse<User>>(`/users/${userId}/status`, { isActive });
  }

  // Get user's labor hours summary
  static async getUserLaborSummary(
    userId: string, 
    params?: { startDate?: string; endDate?: string }
  ): Promise<ApiResponse<{
    totalHours: number;
    totalCost: number;
    projectBreakdown: Array<{
      projectId: string;
      projectName: string;
      hours: number;
      cost: number;
    }>;
  }>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }

    const query = searchParams.toString();
    return apiClient.get<ApiResponse<any>>(`/users/${userId}/labor-summary${query ? `?${query}` : ''}`);
  }

  // Upload user avatar
  static async uploadAvatar(userId: string, file: File): Promise<ApiResponse<{ imageUrl: string }>> {
    return apiClient.upload<ApiResponse<{ imageUrl: string }>>(`/users/${userId}/avatar`, file);
  }

  // Get user permissions
  static async getUserPermissions(userId: string): Promise<ApiResponse<string[]>> {
    return apiClient.get<ApiResponse<string[]>>(`/users/${userId}/permissions`);
  }
}

export default UserService;