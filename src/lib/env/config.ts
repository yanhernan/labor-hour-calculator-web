import { getEnv, isFeatureEnabled } from './schema';

// Centralized environment configuration
class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private env: ReturnType<typeof getEnv>;

  private constructor() {
    this.env = getEnv();
  }

  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  // Basic environment info
  get isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }

  // App configuration
  get appName(): string {
    return this.env.APP_NAME;
  }

  get port(): number {
    return this.env.PORT;
  }

  // NextAuth configuration
  get nextAuthUrl(): string {
    return this.env.NEXTAUTH_URL;
  }

  get nextAuthSecret(): string {
    return this.env.NEXTAUTH_SECRET;
  }

  // Google OAuth configuration
  get googleClientId(): string | undefined {
    return this.env.GOOGLE_CLIENT_ID;
  }

  get googleClientSecret(): string | undefined {
    return this.env.GOOGLE_CLIENT_SECRET;
  }

  get isGoogleOAuthEnabled(): boolean {
    return isFeatureEnabled('google-oauth');
  }

  // API configuration
  get authApiUrl(): string {
    return this.env.AUTH_API_URL;
  }

  get publicApiUrl(): string {
    return this.env.NEXT_PUBLIC_API_URL;
  }

  // Database configuration
  get databaseUrl(): string | undefined {
    return this.env.DATABASE_URL;
  }

  get isDatabaseEnabled(): boolean {
    return isFeatureEnabled('database');
  }

  // Redis configuration
  get redisUrl(): string | undefined {
    return this.env.REDIS_URL;
  }

  get isRedisEnabled(): boolean {
    return isFeatureEnabled('redis');
  }

  // Get all configuration as object
  get config() {
    return {
      environment: this.env.NODE_ENV,
      app: {
        name: this.appName,
        port: this.port,
        isDevelopment: this.isDevelopment,
        isProduction: this.isProduction,
      },
      auth: {
        nextAuthUrl: this.nextAuthUrl,
        nextAuthSecret: this.nextAuthSecret,
        googleOAuth: {
          enabled: this.isGoogleOAuthEnabled,
          clientId: this.googleClientId,
        },
      },
      api: {
        authUrl: this.authApiUrl,
        publicUrl: this.publicApiUrl,
      },
      features: {
        googleOAuth: this.isGoogleOAuthEnabled,
        database: this.isDatabaseEnabled,
        redis: this.isRedisEnabled,
      },
    };
  }

  // Validate configuration at runtime
  public validate(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check API URLs are reachable (in development)
    if (this.isDevelopment) {
      try {
        new URL(this.authApiUrl);
        new URL(this.publicApiUrl);
      } catch (error) {
        errors.push('Invalid API URL format');
      }
    }

    // Check NextAuth configuration
    if (this.nextAuthSecret.length < 32) {
      warnings.push('NEXTAUTH_SECRET should be at least 32 characters long');
    }

    // Production-specific checks
    if (this.isProduction) {
      if (!this.nextAuthUrl.startsWith('https://')) {
        errors.push('NEXTAUTH_URL must use HTTPS in production');
      }

      if (!this.authApiUrl.startsWith('https://')) {
        errors.push('AUTH_API_URL must use HTTPS in production');
      }

      if (!this.publicApiUrl.startsWith('https://')) {
        errors.push('NEXT_PUBLIC_API_URL must use HTTPS in production');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Export singleton instance
export const envConfig = EnvironmentConfig.getInstance();
export default envConfig;