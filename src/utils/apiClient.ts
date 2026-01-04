/**
 * API Client Utilities
 * Centralized HTTP client with error handling, retries, and type safety
 */

import { API_ROUTES } from '../config/apiRoutes';
import { API_CONFIG } from '../constants';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class ApiClientError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Enhanced fetch with retry logic and error handling
 */
export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {},
  retries = API_CONFIG.MAX_RETRIES
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: response.statusText,
      }));

      // Retry on server errors
      if (response.status >= 500 && retries > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, API_CONFIG.RETRY_DELAY)
        );
        return apiFetch<T>(url, options, retries - 1);
      }

      throw new ApiClientError(
        errorData.error || `Request failed with status ${response.status}`,
        response.status,
        errorData.code
      );
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiClientError('Request timeout', 408);
    }

    if (error instanceof ApiClientError) {
      throw error;
    }

    // Retry on network errors
    if (retries > 0 && !error.status) {
      await new Promise((resolve) =>
        setTimeout(resolve, API_CONFIG.RETRY_DELAY)
      );
      return apiFetch<T>(url, options, retries - 1);
    }

    throw new ApiClientError(
      error.message || 'Network error',
      error.status
    );
  }
}

/**
 * Type-safe API POST request
 */
export async function apiPost<T = any>(
  route: string,
  data: any,
  options?: RequestInit
): Promise<T> {
  return apiFetch<T>(route, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * Type-safe API GET request
 */
export async function apiGet<T = any>(
  route: string,
  params?: Record<string, string>,
  options?: RequestInit
): Promise<T> {
  let url = route;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  return apiFetch<T>(url, {
    method: 'GET',
    ...options,
  });
}

/**
 * Stream API response (for SSE)
 */
export async function* apiStream(
  route: string,
  data: any
): AsyncGenerator<any, void, unknown> {
  const response = await fetch(route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: response.statusText,
    }));
    throw new ApiClientError(
      error.error || `Stream failed: ${response.status}`,
      response.status
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiClientError('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') return;

          try {
            yield JSON.parse(jsonStr);
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

