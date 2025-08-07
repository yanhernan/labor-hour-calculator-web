'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import envConfig from '@/lib/env/config';

interface Props {
  children: ReactNode;
}

export default function QueryProvider({ children }: Props) {
  // Create a new QueryClient instance for each provider
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          // Time before data is considered stale
          staleTime: 5 * 60 * 1000, // 5 minutes
          
          // Time data stays in cache
          gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
          
          // Retry failed requests
          retry: (failureCount, error: any) => {
            // Don't retry on 4xx errors (client errors)
            if (error?.status >= 400 && error?.status < 500) {
              return false;
            }
            // Retry up to 3 times for other errors
            return failureCount < 3;
          },
          
          // Retry delay with exponential backoff
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          
          // Refetch on window focus (useful for real-time data)
          refetchOnWindowFocus: true,
          
          // Refetch on reconnect
          refetchOnReconnect: true,
          
          // Don't refetch on mount if data is fresh
          refetchOnMount: 'always',
        },
        mutations: {
          // Retry failed mutations
          retry: 1,
          
          // Retry delay for mutations
          retryDelay: 1000,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query devtools in development */}
      {envConfig.isDevelopment && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}