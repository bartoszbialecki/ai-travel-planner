// src/lib/services/logger.ts
// Simple logger abstraction for backend/server use only.
// Replace implementation with a real logger (e.g., winston, pino) for production as needed.

export const logger = {
  log: (...args: unknown[]) => console.log(...args),
  info: (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};
