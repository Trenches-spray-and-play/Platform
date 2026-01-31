// Simple error handling utility for admin-v2

export interface ApiError {
  message: string;
  code?: string;
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return { message: error.message };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  return { message: 'An unexpected error occurred' };
}

export async function parseApiError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.error || data.message || `Error ${res.status}: ${res.statusText}`;
  } catch {
    return `Error ${res.status}: ${res.statusText}`;
  }
}

// Debounce utility for search
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
