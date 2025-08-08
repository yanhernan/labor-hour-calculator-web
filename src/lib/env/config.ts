import { getEnv, isFeatureEnabled } from './schema';

// Centralized environment configuration
class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private env: ReturnType<typeof getEnv>;

  private constructor() {
    this.env = getEnv(this.isClient);
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

  // Execution environment detection
  get isClient(): boolean {
    return typeof window !== 'undefined';
  }

  get isServer(): boolean {
    return typeof window === 'undefined';
  }

  get isBrowser(): boolean {
    return this.isClient;
  }

  get isNodeJS(): boolean {
    return this.isServer;
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
  get primaryApiUrl(): string {
    return this.env.PRIMARY_API_URL;
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
      runtime: {
        isClient: this.isClient,
        isServer: this.isServer,
        isBrowser: this.isBrowser,
        isNodeJS: this.isNodeJS,
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
        authUrl: this.primaryApiUrl,
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
        new URL(this.primaryApiUrl);
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

      if (!this.primaryApiUrl.startsWith('https://')) {
        errors.push('PRIMARY_API_URL must use HTTPS in production');
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