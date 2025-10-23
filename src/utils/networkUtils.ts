/**
 * Network utilities for retry/backoff and timeout handling
 * Provides resilient network operations for flaky mobile networks
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  timeout?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, delay: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> & Pick<RetryOptions, 'onRetry'> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  timeout: 30000,
  shouldRetry: (error: any) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (!error) return false;
    
    const isNetworkError = error.message?.includes('network') || 
                          error.message?.includes('timeout') ||
                          error.message?.includes('fetch');
    
    const isServerError = error.status >= 500 && error.status < 600;
    
    return isNetworkError || isServerError;
  },
  onRetry: undefined,
};

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate exponential backoff delay
 */
const calculateBackoff = (attempt: number, initialDelay: number, maxDelay: number): number => {
  const exponentialDelay = initialDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add 0-30% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
};

/**
 * Execute a function with timeout
 */
const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation "${operation}" timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
};

/**
 * Retry wrapper with exponential backoff
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Add timeout to operation
      const result = await withTimeout(
        operation(),
        opts.timeout,
        operationName
      );
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry = opts.shouldRetry(error);
      const isLastAttempt = attempt === opts.maxRetries;
      
      if (!shouldRetry || isLastAttempt) {
        throw error;
      }
      
      // Calculate backoff delay
      const delay = calculateBackoff(attempt, opts.initialDelay, opts.maxDelay);
      
      // Log structured message
      console.log(
        JSON.stringify({
          level: 'warn',
          operation: operationName,
          attempt: attempt + 1,
          maxRetries: opts.maxRetries,
          delay,
          error: error.message || String(error),
          timestamp: new Date().toISOString(),
        })
      );
      
      // Call onRetry callback if provided
      if (opts.onRetry) {
        opts.onRetry(attempt + 1, delay, error);
      }
      
      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Supabase query wrapper with retry logic
 */
export const supabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  operationName: string,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> => {
  return withRetry(
    async () => {
      const result = await queryFn();
      
      // Throw if there's an error so retry logic can catch it
      if (result.error) {
        throw result.error;
      }
      
      return result;
    },
    operationName,
    options
  );
};

/**
 * Create an abort controller with timeout
 */
export const createAbortController = (timeoutMs: number): AbortController => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
};

/**
 * Network error handler that provides user-friendly messages
 */
export const getNetworkErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  if (error.message?.includes('timeout')) {
    return 'Request timed out. Please check your internet connection and try again.';
  }
  
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'Network error. Please check your internet connection.';
  }
  
  if (error.status === 401) {
    return 'Authentication error. Please log in again.';
  }
  
  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.status === 404) {
    return 'Requested resource not found.';
  }
  
  if (error.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  return error.message || 'An error occurred. Please try again.';
};

/**
 * Check network connectivity using @react-native-community/netinfo
 */
import NetInfo from '@react-native-community/netinfo';

export const checkConnectivity = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch (error) {
    console.error('Error checking connectivity:', error);
    // Assume online if check fails
    return true;
  }
};
