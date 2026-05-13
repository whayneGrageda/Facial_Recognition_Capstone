import { API_BASE_URL } from '../config/api';
import { AuthUser } from '../contexts/AuthContext';

export interface LoginCredentials {
  email: string;
  password: string;
  userType?: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export const authService = {
  /**
   * POST /auth/login
   * Accepts email + password (+ optional userType).
   * Returns { token, user }.
   */
  login: async (credentials: LoginCredentials): Promise<LoginResult> => {
    const url = `${API_BASE_URL}/auth/login`;
    console.log('[AuthService] POST', url);
    console.log('[AuthService] Payload:', { email: credentials.email, userType: credentials.userType });

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });
    } catch (networkErr: any) {
      console.error('[AuthService] Network error:', networkErr?.message ?? networkErr);
      throw networkErr;
    }

    console.log('[AuthService] HTTP status:', response.status);

    const json = await response.json();
    console.log('[AuthService] Response body:', JSON.stringify(json));

    if (!response.ok) {
      throw new Error(json.message || 'Login failed. Check your credentials.');
    }

    // Backend returns { status, message, data: { token, user } }
    const data = json.data ?? json;

    if (!data.token || !data.user) {
      console.error('[AuthService] Unexpected response shape:', json);
      throw new Error('Invalid response from server.');
    }

    console.log('[AuthService] Login success, user role:', data.user.role);

    return {
      token: data.token,
      user: {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        userType: data.user.userType,
      },
    };
  },

  /**
   * POST /auth/logout
   * Invalidates the JWT on the server side.
   */
  logout: async (token: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    // Ignore response — local state is cleared regardless
  },
};
