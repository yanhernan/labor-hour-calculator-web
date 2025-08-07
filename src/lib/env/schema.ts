import { z } from 'zod';

// Define the environment variable schema
const envSchema = z.object({
  // Next.js environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // NextAuth configuration
  NEXTAUTH_URL: z.url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  
  // Google OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // API configuration
  PRIMARY_API_URL: z.url('PRIMARY_API_URL must be a valid URL'),
  
  // Database (if you add one later)
  DATABASE_URL: z.string().optional(),
  
  // Redis (if you add one later)
  REDIS_URL: z.string().optional(),
  
  // Other optional configurations
  APP_NAME: z.string().default('Labor Hour Calculator'),
  PORT: z.string().default('3000').transform(Number).pipe(z.number().positive()),
});

// Create a refined schema that validates Google OAuth configuration
const refinedEnvSchema = envSchema.refine(
  (data) => {
    // If Google Client ID is provided, Client Secret must also be provided
    if (data.GOOGLE_CLIENT_ID && !data.GOOGLE_CLIENT_SECRET) {
      return false;
    }
    if (data.GOOGLE_CLIENT_SECRET && !data.GOOGLE_CLIENT_ID) {
      return false;
    }
    return true;
  },
  {
    message: 'Both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be provided together',
    path: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  }
);

export type EnvSchema = z.infer<typeof envSchema>;

// Environment validation result
export interface EnvValidationResult {
  success: boolean;
  data?: EnvSchema;
  errors?: z.ZodError;
  missing: string[];
  warnings: string[];
}

// Validate environment variables
export function validateEnv(isClient: boolean): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  if(!isClient){
    // Check for required variables
    const requiredVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'PRIMARY_API_URL',
    ];
    
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    });
  }
  
  // Check for optional but recommended variables
  const recommendedVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];
  
  recommendedVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(`${varName} is not set - Google OAuth will not be available`);
    }
  });
  
  try {
    
    const result = refinedEnvSchema.parse(process.env);
    
    return {
      success: true,
      data: result,
      missing,
      warnings
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error,
        missing,
        warnings
      };
    }
    
    throw error;
  }
}

// Get validated environment variables
export function getEnv(isClient: boolean): EnvSchema {
  const result = validateEnv(isClient);
  
  if (!result.success && !isClient) {
    console.error('❌ Environment validation failed:');
    
    if (result.missing.length > 0) {
      console.error('Missing required variables:', result.missing);
    }
    
    if (result.errors) {
      console.error('Validation errors:', result.errors.issues);
    }
    
    throw new Error('Environment validation failed. Please check your environment variables.');
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    result.warnings.forEach(warning => console.warn(warning));
  }
  
  return result.data ?? {
    NODE_ENV: 'development',
    NEXTAUTH_URL: '',
    NEXTAUTH_SECRET: '',
    PRIMARY_API_URL: '',
    APP_NAME: 'Labor Hour Calculator',
    PORT: 3000,
  };
}

// Check if specific features are enabled
export function isFeatureEnabled(feature: 'google-oauth' | 'database' | 'redis'): boolean {
  const env = getEnv(false);
  
  switch (feature) {
    case 'google-oauth':
      return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
    case 'database':
      return !!env.DATABASE_URL;
    case 'redis':
      return !!env.REDIS_URL;
    default:
      return false;
  }
}

export default envSchema;