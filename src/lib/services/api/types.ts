import { JsonApiDataRequest, JsonApiDataResponse } from "@/types/json-api";

// Base API response structure
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

// Pagination structure
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User types
export interface User {
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}


export interface LoginAttributes {
  email: string;
  password: string;
}

// Authentication types
export interface LoginRequest {
  data: JsonApiDataRequest<LoginAttributes>;
}

export interface LoggedAttributes {
  token: string;
  ok: boolean
  user: User;
}

export interface LoggedResponse {
  data: JsonApiDataResponse<LoggedAttributes>;
}

export interface UserAttributes {
  email: string;
  password: string;
  name: string;
}

export interface CompanyAttributes {
  name: string;
}

export interface RegisterRequest {
  user: UserAttributes;
  company: CompanyAttributes;
}

