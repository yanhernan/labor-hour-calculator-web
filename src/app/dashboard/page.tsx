'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-foreground/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Welcome to Your Dashboard!
              </h2>
              <p className="text-foreground/70 mb-4">
                You&apos;ve successfully signed in to Labor Hour Calculator.
              </p>
              {session.accessToken && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    ✅ Authentication token received from API
                  </p>
                </div>
              )}
              <p className="text-sm text-foreground/50 mb-6">
                This is where your labor hour tracking features will be implemented.
              </p>
              
              <div className="space-y-4">
                <Link
                  href="/calculator"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  🧮 Labor Hour Calculator
                </Link>
              </div>
              
              <p className="text-xs text-foreground/40 mt-4">
                Session includes: User ID, Name, Email{session.accessToken ? ', and API Token' : ''}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}