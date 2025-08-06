import { apiClient } from './base';
import { 
  Client, 
  CreateClientRequest, 
  UpdateClientRequest, 
  ApiResponse, 
  PaginatedResponse 
} from './types';

export class ClientService {
  // Get all clients
  static async getClients(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Client>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }

    const query = searchParams.toString();
    return apiClient.get<PaginatedResponse<Client>>(`/clients${query ? `?${query}` : ''}`);
  }

  // Get client by ID
  static async getClientById(id: string): Promise<ApiResponse<Client>> {
    return apiClient.get<ApiResponse<Client>>(`/clients/${id}`);
  }

  // Create new client
  static async createClient(data: CreateClientRequest): Promise<ApiResponse<Client>> {
    return apiClient.post<ApiResponse<Client>>('/clients', data);
  }

  // Update client
  static async updateClient(id: string, data: UpdateClientRequest): Promise<ApiResponse<Client>> {
    return apiClient.put<ApiResponse<Client>>(`/clients/${id}`, data);
  }

  // Delete client
  static async deleteClient(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<ApiResponse<null>>(`/clients/${id}`);
  }

  // Get active clients (for dropdowns)
  static async getActiveClients(): Promise<ApiResponse<Client[]>> {
    return apiClient.get<ApiResponse<Client[]>>('/clients/active');
  }

  // Activate/Deactivate client
  static async toggleClientStatus(id: string, isActive: boolean): Promise<ApiResponse<Client>> {
    return apiClient.patch<ApiResponse<Client>>(`/clients/${id}/status`, { isActive });
  }

  // Get client projects
  static async getClientProjects(id: string): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    status: string;
    totalHours: number;
    totalCost: number;
    budget: number;
    startDate: string;
    endDate: string;
  }>>> {
    return apiClient.get<ApiResponse<any>>(`/clients/${id}/projects`);
  }

  // Get client statistics
  static async getClientStats(id: string): Promise<ApiResponse<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalHours: number;
    totalRevenue: number;
    averageProjectValue: number;
    ongoingProjects: Array<{
      id: string;
      name: string;
      progress: number;
      budget: number;
      spent: number;
    }>;
  }>> {
    return apiClient.get<ApiResponse<any>>(`/clients/${id}/stats`);
  }

  // Get client time report
  static async getClientTimeReport(
    id: string, 
    params?: { startDate?: string; endDate?: string }
  ): Promise<ApiResponse<{
    client: Client;
    totalHours: number;
    totalCost: number;
    monthlyBreakdown: Array<{
      month: string;
      hours: number;
      cost: number;
    }>;
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
    return apiClient.get<ApiResponse<any>>(`/clients/${id}/time-report${query ? `?${query}` : ''}`);
  }

  // Search clients
  static async searchClients(query: string): Promise<ApiResponse<Client[]>> {
    return apiClient.get<ApiResponse<Client[]>>(`/clients/search?q=${encodeURIComponent(query)}`);
  }

  // Get client invoices (if integrated with billing)
  static async getClientInvoices(id: string): Promise<ApiResponse<Array<{
    id: string;
    number: string;
    date: string;
    dueDate: string;
    amount: number;
    status: string;
    paidAt?: string;
  }>>> {
    return apiClient.get<ApiResponse<any>>(`/clients/${id}/invoices`);
  }

  // Export client data
  static async exportClientData(id: string): Promise<Blob> {
    const response = await fetch(`${apiClient['baseURL']}/clients/${id}/export`, {
      method: 'GET',
      headers: await (apiClient as any).getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to export client data');
    }

    return response.blob();
  }
}

export default ClientService;