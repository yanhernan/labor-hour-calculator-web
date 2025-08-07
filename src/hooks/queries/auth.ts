import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import api from '@/services/api';
import type { User, ApiResponse, RegisterRequest } from '@/services/api/types';

// Query keys for auth-related queries
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'currentUser'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// Get current user profile
export function useCurrentUser() {
  const { data: session, status } = useSession();
  
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: () => api.auth.getCurrentUser(),
    enabled: !!session?.accessToken && status === 'authenticated',
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    select: (data: ApiResponse<User>) => data.data,
  });
}

// Update user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updates: Partial<User>) => api.auth.updateProfile(updates),
    onSuccess: (data) => {
      // Update the current user cache
      queryClient.setQueryData(authKeys.currentUser(), data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
    },
  });
}

// Change password
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { 
      currentPassword: string; 
      newPassword: string; 
    }) => api.auth.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      // Optionally show success message
      console.log('Password changed successfully');
    },
    onError: (error) => {
      console.error('Failed to change password:', error);
    },
  });
}

// Request password reset
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => api.auth.requestPasswordReset(email),
    onSuccess: () => {
      console.log('Password reset email sent');
    },
    onError: (error) => {
      console.error('Failed to request password reset:', error);
    },
  });
}

// Reset password
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) => 
      api.auth.resetPassword(token, newPassword),
    onSuccess: () => {
      console.log('Password reset successfully');
    },
    onError: (error) => {
      console.error('Failed to reset password:', error);
    },
  });
}

// Verify email
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => api.auth.verifyEmail(token),
    onSuccess: () => {
      console.log('Email verified successfully');
    },
    onError: (error) => {
      console.error('Failed to verify email:', error);
    },
  });
}

// Resend email verification
export function useResendEmailVerification() {
  return useMutation({
    mutationFn: () => api.auth.resendEmailVerification(),
    onSuccess: () => {
      console.log('Verification email sent');
    },
    onError: (error) => {
      console.error('Failed to resend verification email:', error);
    },
  });
}

// Register new user
export function useRegister() {
  return useMutation({
    mutationFn: (userData: RegisterRequest) => api.auth.register(userData),
    onSuccess: (data) => {
      console.log('Registration successful:', data);
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });
}