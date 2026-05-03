import { apiService } from './api';
import type { LoginCredentials, AuthResponse } from '../types';

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/login', credentials);
  },

  // Logout
  async logout(): Promise<void> {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await apiService.post('/auth/logout');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Verify token
  async verifyToken(): Promise<any> {
    return apiService.get('/auth/verify');
  },

  // Get profile
  async getProfile(): Promise<any> {
    return apiService.get('/auth/profile');
  },

  // Send email verification code
  async sendVerificationCode(email: string): Promise<{ message: string }> {
    return apiService.post('/auth/send-verification', { email });
  },

  // Verify email code
  async verifyEmailCode(email: string, code: string): Promise<{ valid: boolean }> {
    return apiService.post('/auth/verify-email', { email, code });
  },

  // Register college user
  async registerCollege(data: {
    username: string;
    password: string;
    first_name: string;
    middle_initial?: string;
    last_name: string;
    email: string;
    contact_number?: string;
    student_id: string;
    course_id: number;
    year_id: number;
  }): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/register/college', data);
  },

  // Register SHS user
  async registerShs(data: {
    username: string;
    password: string;
    first_name: string;
    middle_initial?: string;
    last_name: string;
    email: string;
    contact_number?: string;
    student_id: string;
    strand_id: number;
    grade_id: number;
  }): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/register/shs', data);
  },

  // Register faculty user
  async registerFaculty(data: {
    username: string;
    password: string;
    first_name: string;
    middle_initial?: string;
    last_name: string;
    email: string;
    contact_number?: string;
    employee_id?: string;
    department_id: number;
  }): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/register/faculty', data);
  },
};
