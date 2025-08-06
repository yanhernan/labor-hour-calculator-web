import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextAuthOptions } from 'next-auth';
import envConfig from '@/lib/env/config';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: envConfig.googleClientId || '',
      clientSecret: envConfig.googleClientSecret || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call your authentication API using the AuthService
          const { AuthService } = await import('@/services/api');
          
          const response = await AuthService.login({
            email: credentials.email,
            password: credentials.password,
          });

          // Return user object with token
          return {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name || `${response.user.firstName} ${response.user.lastName}`,
            image: response.user.image || null,
            accessToken: response.token, // Store the API token
          };

        } catch (error) {
          console.error('Error during authentication:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Store the access token from the API in the JWT token
        if (user.accessToken) {
          token.accessToken = user.accessToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        // Include the access token in the session for API calls
        if (token.accessToken) {
          (session as any).accessToken = token.accessToken;
        }
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: envConfig.nextAuthSecret,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };