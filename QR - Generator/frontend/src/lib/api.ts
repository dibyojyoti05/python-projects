import axios from 'axios';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE,
});

// Interceptor to inject JWT token automatically
client.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('qr_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
}

export interface QRCodeCustomization {
  color?: string;
  bg_color?: string;
  scale?: number;
  border?: number;
  error_correction?: 'l' | 'm' | 'q' | 'h';
  format?: 'svg' | 'png';
}

export interface QRCodeItem {
  id: string;
  name: string;
  is_dynamic: boolean;
  qr_type: string;
  destination_url?: string;
  raw_data?: string;
  short_code?: string;
  customization: QRCodeCustomization;
  image_url?: string;
  is_active: boolean;
  scan_count: number;
  created_at: string;
  campaign_id?: string;
}

export interface QRCodeAnalytics {
  total_scans: number;
  unique_visitors: number;
  last_scanned_at?: string;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  operating_systems: Record<string, number>;
  recent_scans: Array<{
    id: string;
    ip: string;
    country: string;
    city: string;
    device: string;
    browser: string;
    os: string;
    referrer: string;
    scanned_at: string;
  }>;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  qr_count: number;
  created_at?: string;
}

export const api = {
  // Auth
  async login(formData: FormData | URLSearchParams) {
    const res = await client.post('/api/v1/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },

  async signup(data: { email: string; password: string; full_name?: string }) {
    const res = await client.post('/api/v1/auth/signup', data);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await client.get('/api/v1/auth/me');
    return res.data;
  },

  // QR Codes
  async previewQR(data: string, customization: QRCodeCustomization, format: 'svg' | 'png' = 'svg'): Promise<string> {
    const res = await client.post(
      '/api/v1/qr/preview',
      { data, customization, format },
      { responseType: format === 'svg' ? 'text' : 'blob' }
    );
    if (format === 'svg') {
      return `data:image/svg+xml;utf8,${encodeURIComponent(res.data)}`;
    } else {
      return URL.createObjectURL(res.data);
    }
  },

  async createQR(payload: {
    name: string;
    is_dynamic: boolean;
    qr_type: string;
    destination_url?: string;
    raw_data?: string;
    customization?: QRCodeCustomization;
    campaign_id?: string;
  }): Promise<QRCodeItem> {
    const res = await client.post('/api/v1/qr/', payload);
    return res.data;
  },

  async listQRs(): Promise<QRCodeItem[]> {
    const res = await client.get('/api/v1/qr/');
    return res.data;
  },

  async getQR(id: string): Promise<QRCodeItem> {
    const res = await client.get(`/api/v1/qr/${id}`);
    return res.data;
  },

  async updateQR(id: string, payload: Partial<QRCodeItem>): Promise<QRCodeItem> {
    const res = await client.put(`/api/v1/qr/${id}`, payload);
    return res.data;
  },

  async deleteQR(id: string): Promise<{ message: string }> {
    const res = await client.delete(`/api/v1/qr/${id}`);
    return res.data;
  },

  async getAnalytics(id: string): Promise<QRCodeAnalytics> {
    const res = await client.get(`/api/v1/qr/${id}/analytics`);
    return res.data;
  },

  getImageUrl(id: string, format: 'svg' | 'png' = 'svg', scale = 10) {
    return `${API_BASE}/api/v1/qr/${id}/image?format=${format}&scale=${scale}`;
  },

  getRedirectUrl(shortCode: string) {
    return `${API_BASE}/r/${shortCode}`;
  },

  // Campaigns
  async listCampaigns(): Promise<Campaign[]> {
    const res = await client.get('/api/v1/campaigns/');
    return res.data;
  },

  async createCampaign(data: { name: string; description?: string }): Promise<Campaign> {
    const res = await client.post('/api/v1/campaigns/', data);
    return res.data;
  },

  async deleteCampaign(id: string): Promise<{ message: string }> {
    const res = await client.delete(`/api/v1/campaigns/${id}`);
    return res.data;
  },

  // Bulk
  async downloadTemplate(): Promise<Blob> {
    const res = await client.get('/api/v1/bulk/template', { responseType: 'blob' });
    return res.data;
  },

  async generateBulkZip(file: File, format: 'svg' | 'png' = 'png'): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post(`/api/v1/bulk/generate?format=${format}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });
    return res.data;
  },
};
