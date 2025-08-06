'use client';

import { useState, useEffect } from 'react';
import { HealthCheckResponse } from '@/app/api/health/route';

interface HealthCheckProps {
  showDetails?: boolean;
  refreshInterval?: number;
}

export default function HealthCheck({ showDetails = false, refreshInterval = 30000 }: HealthCheckProps) {
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/health', {
        cache: 'no-cache',
      });
      
      const data: HealthCheckResponse = await response.json();
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchHealthData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
        <span className="text-sm">Checking system health...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-600">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm">Health check failed: {error}</span>
        <button 
          onClick={fetchHealthData}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!healthData) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'text-green-600';
      case 'degraded':
      case 'warn':
        return 'text-yellow-600';
      case 'unhealthy':
      case 'fail':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return '✅';
      case 'degraded':
      case 'warn':
        return '⚠️';
      case 'unhealthy':
      case 'fail':
        return '❌';
      default:
        return '⚪';
    }
  };

  return (
    <div className="space-y-3">
      {/* Overall Status */}
      <div className={`flex items-center space-x-2 ${getStatusColor(healthData.status)}`}>
        <span>{getStatusIcon(healthData.status)}</span>
        <span className="font-medium capitalize">{healthData.status}</span>
        <span className="text-sm text-gray-500">
          ({healthData.environment})
        </span>
        {lastUpdated && (
          <span className="text-xs text-gray-400">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Detailed Status */}
      {showDetails && (
        <div className="space-y-2 text-sm">
          {Object.entries(healthData.checks).map(([checkName, check]) => (
            <div key={checkName} className="flex items-center justify-between">
              <span className="capitalize">{checkName.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <div className={`flex items-center space-x-1 ${getStatusColor(check.status)}`}>
                <span>{getStatusIcon(check.status)}</span>
                <span className="text-xs">{check.message}</span>
              </div>
            </div>
          ))}
          
          {/* Uptime */}
          <div className="flex items-center justify-between text-gray-600">
            <span>Uptime:</span>
            <span className="text-xs">{formatUptime(healthData.uptime)}</span>
          </div>
          
          {/* Version */}
          {healthData.version && (
            <div className="flex items-center justify-between text-gray-600">
              <span>Version:</span>
              <span className="text-xs">{healthData.version}</span>
            </div>
          )}
        </div>
      )}

      {/* Warnings and Errors */}
      {healthData.details && (
        <>
          {healthData.details.warnings.length > 0 && (
            <div className="text-xs text-yellow-600">
              <div className="font-medium">Warnings:</div>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {healthData.details.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          {healthData.details.errors.length > 0 && (
            <div className="text-xs text-red-600">
              <div className="font-medium">Errors:</div>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {healthData.details.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {healthData.details.missingEnvVars.length > 0 && (
            <div className="text-xs text-red-600">
              <div className="font-medium">Missing Environment Variables:</div>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {healthData.details.missingEnvVars.map((varName, index) => (
                  <li key={index}>{varName}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchHealthData}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
      >
        Refresh
      </button>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}