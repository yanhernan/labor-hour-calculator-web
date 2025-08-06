import { validateEnv } from './schema';
import envConfig from './config';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m',
};

// Validate environment at application startup
export function validateEnvironmentOnStartup(): void {
  console.log(`${colors.cyan}${colors.bright}🔍 Validating environment configuration...${colors.reset}`);
  
  try {
    const validation = validateEnv();
    const configValidation = envConfig.validate();
    
    if (!validation.success) {
      console.error(`${colors.red}${colors.bright}❌ Environment validation failed!${colors.reset}`);
      
      if (validation.missing.length > 0) {
        console.error(`${colors.red}Missing required environment variables:${colors.reset}`);
        validation.missing.forEach(varName => {
          console.error(`${colors.red}  - ${varName}${colors.reset}`);
        });
      }
      
      if (validation.errors) {
        console.error(`${colors.red}Validation errors:${colors.reset}`);
        validation.errors.issues.forEach(issue => {
          console.error(`${colors.red}  - ${issue.path.join('.')}: ${issue.message}${colors.reset}`);
        });
      }
      
      console.error(`${colors.red}${colors.bright}Please check your .env.local file and ensure all required variables are set.${colors.reset}`);
      process.exit(1);
    }
    
    if (!configValidation.isValid) {
      console.error(`${colors.red}${colors.bright}❌ Configuration validation failed!${colors.reset}`);
      configValidation.errors.forEach(error => {
        console.error(`${colors.red}  - ${error}${colors.reset}`);
      });
      process.exit(1);
    }
    
    // Show warnings
    const allWarnings = [...validation.warnings, ...configValidation.warnings];
    if (allWarnings.length > 0) {
      console.warn(`${colors.yellow}⚠️  Environment warnings:${colors.reset}`);
      allWarnings.forEach(warning => {
        console.warn(`${colors.yellow}  - ${warning}${colors.reset}`);
      });
    }
    
    // Show success message with configuration summary
    console.log(`${colors.green}${colors.bright}✅ Environment validation passed!${colors.reset}`);
    
    // Show environment summary
    const config = envConfig.config;
    console.log(`${colors.blue}📋 Configuration Summary:${colors.reset}`);
    console.log(`${colors.white}  Environment: ${colors.cyan}${config.environment}${colors.reset}`);
    console.log(`${colors.white}  App Name: ${colors.cyan}${config.app.name}${colors.reset}`);
    console.log(`${colors.white}  Port: ${colors.cyan}${config.app.port}${colors.reset}`);
    console.log(`${colors.white}  NextAuth URL: ${colors.cyan}${config.auth.nextAuthUrl}${colors.reset}`);
    console.log(`${colors.white}  API URL: ${colors.cyan}${config.api.publicUrl}${colors.reset}`);
    
    // Show enabled features
    console.log(`${colors.blue}🔧 Enabled Features:${colors.reset}`);
    Object.entries(config.features).forEach(([feature, enabled]) => {
      const status = enabled ? `${colors.green}✓` : `${colors.red}✗`;
      console.log(`${colors.white}  ${feature}: ${status}${colors.reset}`);
    });
    
    console.log(`${colors.green}${colors.bright}🚀 Application is ready to start!${colors.reset}\n`);
    
  } catch (error) {
    console.error(`${colors.red}${colors.bright}❌ Fatal error during environment validation:${colors.reset}`);
    console.error(`${colors.red}${error instanceof Error ? error.message : 'Unknown error'}${colors.reset}`);
    process.exit(1);
  }
}

// Check environment in development mode
export function checkEnvironmentInDevelopment(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  console.log(`${colors.magenta}🛠️  Development mode checks:${colors.reset}`);
  
  // Check if .env.local exists
  try {
    const fs = require('fs');
    const path = require('path');
    const envLocalPath = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envLocalPath)) {
      console.warn(`${colors.yellow}⚠️  .env.local file not found. Consider creating one for local development.${colors.reset}`);
      console.warn(`${colors.yellow}   You can copy .env.example as a starting point.${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ .env.local file found${colors.reset}`);
    }
  } catch (error) {
    // Ignore file system errors
  }
  
  // Check API URLs are not using production domains in development
  const config = envConfig.config;
  if (config.api.publicUrl.includes('localhost') || config.api.publicUrl.includes('127.0.0.1')) {
    console.log(`${colors.green}✓ Using local API endpoints${colors.reset}`);
  } else {
    console.warn(`${colors.yellow}⚠️  Using remote API endpoints in development: ${config.api.publicUrl}${colors.reset}`);
  }
  
  console.log('');
}

// Export main validation function
export function validateEnvironment(): void {
  validateEnvironmentOnStartup();
  checkEnvironmentInDevelopment();
}

// Auto-run validation if this file is imported
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Only run on server-side and not in tests
  try {
    validateEnvironment();
  } catch (error) {
    // Validation already logged the error and exited if needed
  }
}