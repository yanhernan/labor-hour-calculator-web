import { RegisterRequest } from "@/lib/services/api/types";
import { useMutation } from "@tanstack/react-query";
import { register } from "../api-calls";
import { JsonApiRequest } from "@/types/json-api";

// Register new user
export function useRegister() {
    return useMutation({
      mutationFn: (userData: JsonApiRequest<RegisterRequest>) => register(userData),
      onSuccess: (data) => {
        console.log('Registration successful:', data);
      },
      onError: (error) => {
        console.error('Registration failed:', error);
      },
    });
  }