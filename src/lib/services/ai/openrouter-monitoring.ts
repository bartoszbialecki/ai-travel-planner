import type { AIGenerationRequest, AIGenerationResult } from "./types";
import type { UsageStats } from "./openrouter.types";

export interface MonitoringMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageProcessingTime: number;
  totalTokensUsed: number;
  lastRequestTime?: Date;
  errors: ErrorLog[];
}

export interface ErrorLog {
  timestamp: Date;
  error: string;
  statusCode?: number;
  requestId: string;
  destination: string;
}

export interface PerformanceMetrics {
  processingTime: number;
  tokenCount: number;
  model: string;
  destination: string;
  success: boolean;
}

class OpenRouterMonitoring {
  private static instance: OpenRouterMonitoring;
  private metrics: MonitoringMetrics = {
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    averageProcessingTime: 0,
    totalTokensUsed: 0,
    errors: [],
  };

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): OpenRouterMonitoring {
    if (!OpenRouterMonitoring.instance) {
      OpenRouterMonitoring.instance = new OpenRouterMonitoring();
    }
    return OpenRouterMonitoring.instance;
  }

  /**
   * Logs a successful request with performance metrics
   */
  logSuccess(request: AIGenerationRequest, result: AIGenerationResult, usageStats: UsageStats, model: string): void {
    this.metrics.requestCount++;
    this.metrics.successCount++;
    this.metrics.lastRequestTime = new Date();
    this.metrics.totalTokensUsed += usageStats.totalTokens;

    // Update average processing time
    const currentAvg = this.metrics.averageProcessingTime;
    const requestCount = this.metrics.requestCount;
    this.metrics.averageProcessingTime = (currentAvg * (requestCount - 1) + result.processing_time_ms) / requestCount;

    // Log performance metrics
    this.logPerformance({
      processingTime: result.processing_time_ms,
      tokenCount: usageStats.totalTokens,
      model,
      destination: request.destination,
      success: true,
    });

    console.log(`✅ OpenRouter: Successfully generated plan for ${request.destination}`, {
      processingTime: result.processing_time_ms,
      tokens: usageStats.totalTokens,
      model,
    });
  }

  /**
   * Logs a failed request with error details
   */
  logError(request: AIGenerationRequest, error: Error, statusCode?: number, requestId?: string): void {
    this.metrics.requestCount++;
    this.metrics.errorCount++;
    this.metrics.lastRequestTime = new Date();

    const errorLog: ErrorLog = {
      timestamp: new Date(),
      error: error.message,
      statusCode,
      requestId: requestId || this.generateRequestId(),
      destination: request.destination,
    };

    this.metrics.errors.push(errorLog);

    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100);
    }

    // Log performance metrics for failed requests
    this.logPerformance({
      processingTime: 0,
      tokenCount: 0,
      model: "unknown",
      destination: request.destination,
      success: false,
    });

    console.error(`❌ OpenRouter: Failed to generate plan for ${request.destination}`, {
      error: error.message,
      statusCode,
      requestId: errorLog.requestId,
    });
  }

  /**
   * Logs performance metrics for analysis
   */
  private logPerformance(metrics: PerformanceMetrics): void {
    // In a production environment, this would send metrics to a monitoring service
    // For now, we'll just log to console with structured format
    console.log("📊 OpenRouter Performance:", {
      destination: metrics.destination,
      model: metrics.model,
      processingTime: metrics.processingTime,
      tokens: metrics.tokenCount,
      success: metrics.success,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Gets current monitoring metrics
   */
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  /**
   * Gets success rate percentage
   */
  getSuccessRate(): number {
    if (this.metrics.requestCount === 0) return 0;
    return (this.metrics.successCount / this.metrics.requestCount) * 100;
  }

  /**
   * Gets average tokens per request
   */
  getAverageTokensPerRequest(): number {
    if (this.metrics.requestCount === 0) return 0;
    return this.metrics.totalTokensUsed / this.metrics.requestCount;
  }

  /**
   * Gets recent errors (last 10)
   */
  getRecentErrors(): ErrorLog[] {
    return this.metrics.errors.slice(-10);
  }

  /**
   * Resets monitoring metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageProcessingTime: 0,
      totalTokensUsed: 0,
      errors: [],
    };
  }

  /**
   * Generates a unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Checks if the service is healthy based on recent performance
   */
  isHealthy(): boolean {
    const successRate = this.getSuccessRate();
    const recentErrors = this.getRecentErrors();
    const hasRecentErrors = recentErrors.some(
      (error) => Date.now() - error.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    return successRate >= 80 && !hasRecentErrors;
  }

  /**
   * Gets health status with details
   */
  getHealthStatus(): {
    healthy: boolean;
    successRate: number;
    recentErrors: number;
    averageProcessingTime: number;
  } {
    const recentErrors = this.getRecentErrors().filter(
      (error) => Date.now() - error.timestamp.getTime() < 5 * 60 * 1000
    ).length;

    return {
      healthy: this.isHealthy(),
      successRate: this.getSuccessRate(),
      recentErrors,
      averageProcessingTime: this.metrics.averageProcessingTime,
    };
  }
}

export const openRouterMonitoring = OpenRouterMonitoring.getInstance();
