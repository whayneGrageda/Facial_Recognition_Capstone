import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, REQUEST_TIMEOUT } from '../config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  status: number;
  message: string;
  data?: T;
}

// ─── Token Helper ─────────────────────────────────────────────────────────────

const getToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem('@facetrack_token');
};

// ─── Fetch Wrapper ────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(json.message || `Request failed with status ${response.status}`);
    }

    // The backend wraps data in { status, message, data }
    return (json.data ?? json) as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Check your network connection.');
    }
    throw error;
  }
}

// ─── HTTP Methods ─────────────────────────────────────────────────────────────

export const apiService = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>) => {
    let url = path;
    if (params) {
      const query = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      if (query) url += `?${query}`;
    }
    return request<T>(url, { method: 'GET' });
  },

  post: <T>(path: string, body: unknown, requiresAuth = true) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, requiresAuth),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
