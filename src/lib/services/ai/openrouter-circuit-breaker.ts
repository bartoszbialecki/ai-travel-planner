import { OPENROUTER_TIMEOUT_MS } from "./openrouter-constants";
import { logger } from "@/lib/services/logger";

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  expectedResponseTime: number;
}

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  totalRequests: number;
}

/**
 * Circuit Breaker pattern implementation for OpenRouter API
 * Prevents cascading failures by temporarily stopping requests when the service is failing
 */
class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private totalRequests = 0;
  private nextAttemptTime?: Date;

  constructor(private options: CircuitBreakerOptions) {}

  /**
   * Executes a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit is open and if we should attempt recovery
    if (this.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.state = "HALF_OPEN";
        logger.log("🔄 Circuit Breaker: Attempting recovery (HALF_OPEN)");
      } else {
        throw new Error("Circuit breaker is OPEN - service temporarily unavailable");
      }
    }

    try {
      const result = await this.withTimeout(fn, this.options.expectedResponseTime);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handles successful execution
   */
  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();
    this.failureCount = 0;

    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      logger.log("✅ Circuit Breaker: Service recovered, circuit CLOSED");
    }
  }

  /**
   * Handles failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.nextAttemptTime = new Date(Date.now() + this.options.recoveryTimeout);
      logger.log("❌ Circuit Breaker: Recovery failed, circuit OPEN");
    } else if (this.state === "CLOSED" && this.failureCount >= this.options.failureThreshold) {
      this.state = "OPEN";
      this.nextAttemptTime = new Date(Date.now() + this.options.recoveryTimeout);
      logger.log("🚨 Circuit Breaker: Failure threshold reached, circuit OPEN");
    }
  }

  /**
   * Checks if enough time has passed to attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.nextAttemptTime) return false;
    return Date.now() >= this.nextAttemptTime.getTime();
  }

  /**
   * Executes a function with timeout
   */
  private async withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }

  /**
   * Gets current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
    };
  }

  /**
   * Manually resets the circuit breaker
   */
  reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttemptTime = undefined;
    logger.log("🔄 Circuit Breaker: Manually reset");
  }

  /**
   * Checks if the circuit is healthy
   */
  isHealthy(): boolean {
    return this.state === "CLOSED" || this.state === "HALF_OPEN";
  }

  /**
   * Gets the current state
   */
  getState(): CircuitState {
    return this.state;
  }
}

// Create circuit breaker instance with reasonable defaults
export const openRouterCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5, // Open circuit after 5 consecutive failures
  recoveryTimeout: 30 * 1000, // Wait 30 seconds before attempting recovery
  expectedResponseTime: OPENROUTER_TIMEOUT_MS, // Use shared timeout value
});
