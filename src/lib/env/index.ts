// Main export file for environment utilities
export { validateEnv, getEnv, isFeatureEnabled, type EnvSchema, type EnvValidationResult } from './schema';
import { default as envConfig } from './config';
export { validateEnvironment, validateEnvironmentOnStartup, checkEnvironmentInDevelopment } from './startup';

// Re-export for convenience
export default envConfig;