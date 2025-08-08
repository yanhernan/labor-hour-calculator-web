import { NextRequest, NextResponse } from 'next/server';
import { validateEnv, isFeatureEnabled } from '@/lib/env/schema';
import envConfig from '@/lib/env/config';
import { withLogging } from '@/lib/logging';
import { fa } from 'zod/locales';

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  environment: string;
  version?: string;
  checks: {
    environment: HealthCheck;
    features: HealthCheck;
    services: HealthCheck;
  };
  details?: {
    errors: string[];
    warnings: string[];
    missingEnvVars: string[];
  };
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: any;
}

// Health check endpoint
async function healthCheckHandler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Environment validation
    const envValidation = validateEnv(false);
    const configValidation = envConfig.validate();
    
    // Check environment variables
    const environmentCheck: HealthCheck = {
      status: envValidation.success && configValidation.isValid ? 'pass' : 'fail',
      message: envValidation.success && configValidation.isValid 
        ? 'All environment variables are valid'
        : 'Environment validation failed',
      details: {
        requiredVarsPresent: envValidation.success,
        configurationValid: configValidation.isValid,
        errors: configValidation.errors,
        warnings: [...(envValidation.warnings || []), ...configValidation.warnings],
      }
    };

    // Check enabled features
    const featuresCheck: HealthCheck = {
      status: 'pass',
      message: 'Feature availability checked',
      details: {
        googleOAuth: isFeatureEnabled('google-oauth'),
        database: isFeatureEnabled('database'),
        redis: isFeatureEnabled('redis'),
      }
    };

    // Check external services (API connectivity)
    const servicesCheck = await checkExternalServices();

    // Determine overall health status
    const checks = { environment: environmentCheck, features: featuresCheck, services: servicesCheck };
    const hasFailures = Object.values(checks).some(check => check.status === 'fail');
    const hasWarnings = Object.values(checks).some(check => check.status === 'warn');
    
    const overallStatus: HealthCheckResponse['status'] = hasFailures 
      ? 'unhealthy' 
      : hasWarnings 
        ? 'degraded' 
        : 'healthy';

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: envConfig.config.environment,
      version: process.env.npm_package_version,
      checks,
      details: {
        errors: configValidation.errors,
        warnings: [...(envValidation.warnings || []), ...configValidation.warnings],
        missingEnvVars: envValidation.missing,
      }
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Duration': `${Date.now() - startTime}ms`,
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      checks: {
        environment: {
          status: 'fail',
          message: 'Health check error',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        features: {
          status: 'fail',
          message: 'Could not check features'
        },
        services: {
          status: 'fail',
          message: 'Could not check services'
        }
      },
      details: {
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
        missingEnvVars: []
      }
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Duration': `${Date.now() - startTime}ms`,
      }
    });
  }
}

// Export the wrapped handler
export const GET = withLogging(healthCheckHandler);

// Check external services connectivity
async function checkExternalServices(): Promise<HealthCheck> {
  const checks: Array<{ name: string; url: string; status: 'pass' | 'fail'; message: string; responseTime?: number }> = [];
  
  try {
    // Check auth API connectivity
    const authApiUrl = envConfig.config.api.authUrl;
    if (authApiUrl) {
      const authCheck = await checkServiceHealth(authApiUrl, 'Auth API');
      checks.push(authCheck);
    }

    // Check public API connectivity

    const allPassed = checks.every(check => check.status === 'pass');
    const someFailed = checks.some(check => check.status === 'fail');

    return {
      status: someFailed ? 'fail' : allPassed ? 'pass' : 'warn',
      message: someFailed 
        ? 'Some external services are unreachable'
        : allPassed 
          ? 'All external services are reachable'
          : 'External service status mixed',
      details: checks.reduce((acc, check) => {
        acc[check.name] = {
          status: check.status,
          message: check.message,
          responseTime: check.responseTime
        };
        return acc;
      }, {} as Record<string, any>)
    };

  } catch (error) {
    return {
      status: 'fail',
      message: 'Failed to check external services',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

// Check individual service health
async function checkServiceHealth(url: string, serviceName: string, timeout = 5000): Promise<{
  name: string;
  url: string;
  status: 'pass' | 'fail';
  message: string;
  responseTime?: number;
}> {
  const startTime = Date.now();
  
  try {
    // Create a health check URL (try /health first, fallback to base URL)
    const healthUrls = [
      `${url}/health`,
      `${url}/ping`,
      url
    ];

    let lastError: Error | null = null;
    
    for (const healthUrl of healthUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(healthUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Health-Check/1.0',
          }
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        if (response.ok || response.status === 404) { // 404 is acceptable for health check
          return {
            name: serviceName,
            url: healthUrl,
            status: 'pass',
            message: `Service reachable (${response.status})`,
            responseTime
          };
        }
        
        lastError = new Error(`HTTP ${response.status}`);
        
      } catch (error) {
        lastError = error as Error;
        continue; // Try next URL
      }
    }
    
    throw lastError || new Error('All health check URLs failed');
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      name: serviceName,
      url,
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    };
  }
}