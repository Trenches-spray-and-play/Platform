// ============================================
// Admin V2 Error Handling & Audit Logging
// ============================================

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  retryable?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  userId?: string;
  resource: string;
  status: 'success' | 'error';
  details?: Record<string, any>;
  error?: string;
}

// ============================================
// Error Handling
// ============================================

export function handleApiError(error: unknown): ApiError {
  if (error instanceof Response) {
    return {
      message: `HTTP ${error.status}: ${error.statusText}`,
      status: error.status,
      retryable: error.status >= 500 || error.status === 429,
    };
  }
  
  if (error instanceof Error) {
    // Network errors are retryable
    const isNetworkError = 
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout');
    
    return {
      message: error.message,
      code: (error as any).code,
      retryable: isNetworkError,
    };
  }
  
  if (typeof error === 'string') {
    return { message: error, retryable: false };
  }
  
  return { message: 'An unexpected error occurred', retryable: false };
}

export async function parseApiError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.error || data.message || `Error ${res.status}: ${res.statusText}`;
  } catch {
    return `Error ${res.status}: ${res.statusText}`;
  }
}

// ============================================
// Retry Logic with Exponential Backoff
// ============================================

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: ApiError) => boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error) => error.retryable === true,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: ApiError;

  for (let attempt = 0; attempt <= (opts.maxRetries || 0); attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = handleApiError(error);
      
      // Don't retry on last attempt
      if (attempt === opts.maxRetries) break;
      
      // Check if we should retry this error
      if (opts.shouldRetry && !opts.shouldRetry(lastError)) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        (opts.baseDelay || 1000) * Math.pow(2, attempt),
        opts.maxDelay || 10000
      );
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 200;
      
      await sleep(delay + jitter);
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// API Client with Built-in Error Handling
// ============================================

interface FetchOptions extends RequestInit {
  retries?: number;
  validateResponse?: (data: any) => boolean;
}

export async function safeFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { retries = 3, validateResponse, ...fetchOptions } = options;

  return withRetry(async () => {
    const res = await fetch(url, fetchOptions);
    
    if (!res.ok) {
      const errorMessage = await parseApiError(res);
      throw new Error(errorMessage);
    }

    const data = await res.json();
    
    // Validate response if validator provided
    if (validateResponse && !validateResponse(data)) {
      throw new Error('Invalid response format from server');
    }
    
    return data;
  }, { maxRetries: retries });
}

// ============================================
// Audit Logging
// ============================================

class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs: number = 100;

  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(newEntry);
    
    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also send to server in production
    this.sendToServer(newEntry).catch(console.error);
  }

  getLogs(filter?: Partial<AuditLogEntry>): AuditLogEntry[] {
    if (!filter) return [...this.logs];
    
    return this.logs.filter(log => {
      return Object.entries(filter).every(([key, value]) => {
        return log[key as keyof AuditLogEntry] === value;
      });
    });
  }

  clear(): void {
    this.logs = [];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendToServer(entry: AuditLogEntry): Promise<void> {
    // In production, this would send to an audit log endpoint
    // For now, just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Audit]', entry);
    }
  }
}

export const auditLogger = new AuditLogger();

// ============================================
// Utility Hooks Helpers
// ============================================

export function createAuditAction<T extends (...args: any[]) => Promise<any>>(
  actionName: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      
      auditLogger.log({
        action: actionName,
        resource: args[0]?.id || args[0]?.toString() || 'unknown',
        status: 'success',
        details: { 
          args: args.map(a => typeof a === 'object' ? '[Object]' : a),
          duration: Date.now() - startTime,
        },
      });
      
      return result;
    } catch (error) {
      const apiError = handleApiError(error);
      
      auditLogger.log({
        action: actionName,
        resource: args[0]?.id || args[0]?.toString() || 'unknown',
        status: 'error',
        error: apiError.message,
        details: { 
          args: args.map(a => typeof a === 'object' ? '[Object]' : a),
          duration: Date.now() - startTime,
        },
      });
      
      throw error;
    }
  }) as T;
}

// ============================================
// Debounce Utility
// ============================================

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ============================================
// Validation Helpers
// ============================================

export function isValidCampaign(data: any): boolean {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.tokenSymbol === 'string'
  );
}

export function isValidUser(data: any): boolean {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.handle === 'string'
  );
}

export function isValidPayout(data: any): boolean {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.amount === 'number' &&
    typeof data.status === 'string'
  );
}
