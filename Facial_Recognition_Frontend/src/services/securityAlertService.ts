import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export interface SecurityAlert {
  id: number;
  alert_type: string;
  camera_type: string;
  ai_analysis: string;
  image_path: string | null;
  severity: string;
  is_resolved: boolean;
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
  metadata: any;
}

export const securityAlertService = {
  /**
   * Get all security alerts with pagination and filters
   */
  getAll: async (
    page: number = 1,
    limit: number = 50,
    filters?: {
      alert_type?: string;
      camera_type?: string;
      is_resolved?: boolean;
      severity?: string;
      start_date?: string;
      end_date?: string;
    }
  ) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    } as any);

    const response = await axios.get(`${API_URL}/security-alerts?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.data;
  },

  /**
   * Get recent unresolved alerts (for dashboard)
   */
  getRecentUnresolved: async (limit: number = 10): Promise<SecurityAlert[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/security-alerts/recent-unresolved?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.data;
  },

  /**
   * Get alert by ID
   */
  getById: async (id: number): Promise<SecurityAlert> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/security-alerts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.data;
  },

  /**
   * Mark alert as resolved
   */
  resolve: async (id: number): Promise<void> => {
    const token = localStorage.getItem('token');
    await axios.patch(
      `${API_URL}/security-alerts/${id}/resolve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  /**
   * Delete alert
   */
  delete: async (id: number): Promise<void> => {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/security-alerts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  /**
   * Get alert statistics
   */
  getStats: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/security-alerts/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.data;
  }
};
