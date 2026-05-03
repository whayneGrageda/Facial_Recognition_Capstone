import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiResponse, ApiError } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An error occurred',
          status: error.response?.status,
        };

        // Handle 401 Unauthorized - but not for login endpoint
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }

        return Promise.reject(apiError);
      }
    );
  }

  // Generic GET request
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<ApiResponse<T>>(url, { params });
    return response.data.data as T;
  }

  // Generic POST request
  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.post<ApiResponse<T>>(url, data);
    return response.data.data as T;
  }

  // Generic PUT request
  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<ApiResponse<T>>(url, data);
    return response.data.data as T;
  }

  // Generic PATCH request
  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.patch<ApiResponse<T>>(url, data);
    return response.data.data as T;
  }

  // Generic DELETE request
  async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete<ApiResponse<T>>(url);
    return response.data.data as T;
  }

  // Upload file
  async upload<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.api.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data as T;
  }

  // Download file
  async download(url: string, params?: any): Promise<Blob> {
    const response = await this.api.get(url, { 
      params,
      responseType: 'blob' 
    });
    return response.data;
  }
}

export const apiService = new ApiService();
