import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mailmind_token');
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
  is_active: boolean;
}

export interface EmailAnalysis {
  id: string;
  category?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  intent?: string;
  short_summary?: string;
  key_points?: string[];
  requires_response: boolean;
  suggested_response?: string;
  entities?: Record<string, unknown>;
  action_items?: string[];
}

export interface EmailMessage {
  id: string;
  account_id: string;
  provider_message_id: string;
  thread_id?: string;
  sender: string;
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_text?: string;
  body_html?: string;
  received_at: string;
  is_read: boolean;
  is_starred: boolean;
  folder: string;
  analysis?: EmailAnalysis;
}

export interface EmailStats {
  total: number;
  unread: number;
  urgent: number;
  important: number;
  needs_action: number;
}

export interface Task {
  id: string;
  user_id: string;
  source_email_id?: string;
  title: string;
  description?: string;
  deadline?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  conditions: {
    category?: string;
    priority?: string;
    sender_contains?: string;
  };
  actions: {
    action_type: string;
    task_title?: string;
  };
  created_at: string;
}

export interface EmailCitation {
  id: string;
  sender: string;
  subject: string;
  date: string;
  priority?: string;
  category?: string;
}

export interface ChatResponse {
  reply: string;
  citations?: EmailCitation[];
  suggested_actions?: string[];
}

// APIs
export const authAPI = {
  login: async (formData: FormData) => {
    const res = await api.post<{ access_token: string; token_type: string }>('/auth/login', formData);
    return res.data;
  },
  register: async (data: { email: string; password: string; full_name?: string }) => {
    const res = await api.post<User>('/auth/register', data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

export const emailsAPI = {
  getEmails: async (params?: { folder?: string; filter?: string; category?: string; skip?: number; limit?: number }) => {
    const res = await api.get<EmailMessage[]>('/emails/', { params });
    return res.data;
  },
  getEmail: async (id: string) => {
    const res = await api.get<EmailMessage>(`/emails/${id}`);
    return res.data;
  },
  updateEmail: async (id: string, data: { is_read?: boolean; is_starred?: boolean; folder?: string }) => {
    const res = await api.patch<EmailMessage>(`/emails/${id}`, data);
    return res.data;
  },
  getStats: async () => {
    const res = await api.get<EmailStats>('/emails/stats/summary');
    return res.data;
  },
  seedDemo: async () => {
    const res = await api.post<{ message: string }>('/emails/seed-demo');
    return res.data;
  },
};

export const tasksAPI = {
  getTasks: async (status?: string) => {
    const res = await api.get<Task[]>('/tasks/', { params: { status } });
    return res.data;
  },
  createTask: async (data: { title: string; description?: string; priority?: string; deadline?: string; source_email_id?: string }) => {
    const res = await api.post<Task>('/tasks/', data);
    return res.data;
  },
  updateTask: async (id: string, data: { title?: string; status?: string; priority?: string }) => {
    const res = await api.patch<Task>(`/tasks/${id}`, data);
    return res.data;
  },
  deleteTask: async (id: string) => {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  },
};

export const automationsAPI = {
  getAutomations: async () => {
    const res = await api.get<AutomationRule[]>('/automations/');
    return res.data;
  },
  createAutomation: async (data: { name: string; is_active?: boolean; conditions: Record<string, unknown>; actions: Record<string, unknown> }) => {
    const res = await api.post<AutomationRule>('/automations/', data);
    return res.data;
  },
  toggleAutomation: async (id: string) => {
    const res = await api.patch<AutomationRule>(`/automations/${id}/toggle`);
    return res.data;
  },
  deleteAutomation: async (id: string) => {
    const res = await api.delete(`/automations/${id}`);
    return res.data;
  },
};

export const assistantAPI = {
  chat: async (message: string, history?: { role: string; content: string }[]) => {
    const res = await api.post<ChatResponse>('/assistant/chat', { message, history });
    return res.data;
  },
};

export const searchAPI = {
  search: async (q: string) => {
    const res = await api.get<EmailMessage[]>('/search/', { params: { q } });
    return res.data;
  },
};
