export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || JSON.stringify(errorJson);
    } catch {
      // fallback to statusText
    }
    throw new Error(errorDetail);
  }

  // If 204 or empty response
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export interface ContactItem {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  attributes: Record<string, unknown>;
  is_subscribed: boolean;
  created_at: string;
}

export interface CampaignItem {
  id: string;
  name: string;
  subject: string;
  status: string;
  content_html: string;
  content_text?: string;
  created_at: string;
  sent_at?: string;
}

export interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  status: string;
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
  created_at?: string;
}

export interface DashboardOverviewData {
  stats: Array<{ name: string; value: string; change: string; is_positive: boolean }>;
  chart_data: Array<{ name: string; sent: number; opened: number; clicked: number }>;
  recent_activity: Array<{ id: string; message: string; time_ago: string; type: string }>;
  total_contacts: number;
  total_campaigns: number;
  total_workflows: number;
}

export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      request<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    register: (data: { email: string; password: string; full_name?: string }) =>
      request<{ id: string; email: string; full_name?: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    me: () =>
      request<{ id: string; email: string; full_name?: string; role: string }>("/auth/me"),
  },

  dashboard: {
    getOverview: () => request<DashboardOverviewData>("/dashboard/overview"),
  },

  contacts: {
    list: (params?: { search?: string; status?: string; skip?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      if (params?.status) query.append("status", params.status);
      if (params?.skip) query.append("skip", params.skip.toString());
      if (params?.limit) query.append("limit", params.limit.toString());
      const qs = query.toString() ? `?${query.toString()}` : "";
      return request<ContactItem[]>(`/contacts/${qs}`);
    },
    create: (data: { email: string; first_name?: string; last_name?: string; attributes?: Record<string, unknown> }) =>
      request<{ id: string; email: string; first_name?: string; last_name?: string }>("/contacts/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<Record<string, unknown>>(`/contacts/${id}`, { method: "DELETE" }),
    importCsv: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const url = `${API_BASE_URL}/contacts/import-csv`;
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const res = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to import CSV");
      }
      return res.json() as Promise<{
        total_parsed: number;
        imported: number;
        skipped_duplicates: number;
        errors: string[];
      }>;
    },
  },

  campaigns: {
    list: () => request<CampaignItem[]>("/campaigns/"),
    get: (id: string) =>
      request<CampaignItem>(`/campaigns/${id}`),
    create: (data: { name: string; subject: string; content_html: string; content_text?: string }) =>
      request<{ id: string; name: string; subject: string }>("/campaigns/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{ name: string; subject: string; content_html: string; content_text?: string; status: string }>) =>
      request<CampaignItem>(`/campaigns/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<Record<string, unknown>>(`/campaigns/${id}`, { method: "DELETE" }),
    send: (id: string) =>
      request<{
        message: string;
        status: string;
        total_recipients: number;
        sent_count: number;
        failed_count: number;
      }>(`/campaigns/${id}/send`, { method: "POST" }),
    test: (id: string, recipientEmail: string) =>
      request<{ success: boolean; message: string }>(`/campaigns/${id}/test`, {
        method: "POST",
        body: JSON.stringify({ recipient_email: recipientEmail }),
      }),
    stats: (id: string) =>
      request<{
        campaign_id: string;
        total_recipients: number;
        sent_count: number;
        opened_count: number;
        clicked_count: number;
        open_rate: number;
        click_rate: number;
      }>(`/campaigns/${id}/stats`),
  },

  workflows: {
    list: () => request<WorkflowItem[]>("/workflows/"),
    get: (id: string) => request<WorkflowItem>(`/workflows/${id}`),
    create: (data: { name: string; description?: string; nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>>; status?: string }) =>
      request<{ id: string; name: string }>("/workflows/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { name?: string; description?: string; nodes?: Array<Record<string, unknown>>; edges?: Array<Record<string, unknown>>; status?: string }) =>
      request<WorkflowItem>(`/workflows/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<Record<string, unknown>>(`/workflows/${id}`, { method: "DELETE" }),
    testRun: (id: string, contactEmail?: string) =>
      request<{
        success: boolean;
        steps_count: number;
        steps: Array<{ node_id: string; label: string; action_summary: string; status: string }>;
        error?: string;
      }>(`/workflows/${id}/test-run`, {
        method: "POST",
        body: JSON.stringify({ contact_email: contactEmail }),
      }),
  },
};
