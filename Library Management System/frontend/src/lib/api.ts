const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const err = await response.json();
      errorMessage = err.detail || err.message || JSON.stringify(err);
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(username: string, password: string):Promise<{ access_token: string; token_type: string }> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed. Please check your credentials.');
    }
    return res.json();
  },

  async getCurrentUser() {
    return request<any>('/api/v1/users/me');
  },

  // Dashboard
  async getDashboardStats() {
    return request<any>('/api/v1/dashboard/stats');
  },

  // Catalog & Books
  async getBooks(q?: string, categoryId?: number) {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (categoryId) params.append('category_id', categoryId.toString());
    return request<any[]>(`/api/v1/books/?${params.toString()}`);
  },

  async getBook(id: number) {
    return request<any>(`/api/v1/books/${id}`);
  },

  async createBook(data: any) {
    return request<any>('/api/v1/books/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBook(id: number, data: any) {
    return request<any>(`/api/v1/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteBook(id: number) {
    return request<any>(`/api/v1/books/${id}`, {
      method: 'DELETE',
    });
  },

  // Catalog entities
  async getCategories() {
    return request<any[]>('/api/v1/catalog/categories');
  },

  async getAuthors() {
    return request<any[]>('/api/v1/catalog/authors');
  },

  async getPublishers() {
    return request<any[]>('/api/v1/catalog/publishers');
  },

  async getBranches() {
    return request<any[]>('/api/v1/catalog/branches');
  },

  // Members
  async getMembers(q?: string, status?: string) {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (status) params.append('status', status);
    return request<any[]>(`/api/v1/members/?${params.toString()}`);
  },

  async quickRegisterMember(data: any) {
    return request<any>('/api/v1/members/quick', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMember(id: number) {
    return request<any>(`/api/v1/members/${id}`);
  },

  async deleteMember(id: number) {
    return request<any>(`/api/v1/members/${id}`, {
      method: 'DELETE',
    });
  },

  // Circulation
  async getLoans(status?: string, overdueOnly: boolean = false) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (overdueOnly) params.append('overdue_only', 'true');
    return request<any[]>(`/api/v1/circulation/loans?${params.toString()}`);
  },

  async issueBook(copyId: number, memberId: number, dueDays: number = 14) {
    return request<any>('/api/v1/circulation/issue', {
      method: 'POST',
      body: JSON.stringify({
        copy_id: copyId,
        member_id: memberId,
        due_days: dueDays,
      }),
    });
  },

  async returnBook(loanId: number) {
    return request<any>(`/api/v1/circulation/${loanId}/return`, {
      method: 'POST',
    });
  },

  async renewLoan(loanId: number) {
    return request<any>(`/api/v1/circulation/renew/${loanId}`, {
      method: 'POST',
    });
  },

  // Financials & Fines
  async getFines(status?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    return request<any[]>(`/api/v1/financial/fines?${params.toString()}`);
  },

  async processPayment(fineId: number, amount: number, paymentMethod: string = 'card') {
    return request<any>('/api/v1/financial/payments', {
      method: 'POST',
      body: JSON.stringify({
        fine_id: fineId,
        amount,
        payment_method: paymentMethod,
      }),
    });
  },

  async getPayments() {
    return request<any[]>('/api/v1/financial/payments');
  },

  async getReservations() {
    return request<any[]>('/api/v1/financial/reservations');
  },

  async createReservation(bookId: number, memberId: number) {
    return request<any>('/api/v1/financial/reservations', {
      method: 'POST',
      body: JSON.stringify({
        book_id: bookId,
        member_id: memberId,
      }),
    });
  },

  // AI Assistant
  async askAI(query: string) {
    return request<{ answer: string; suggestions: string[] }>('/api/v1/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },

  // Audit Logs
  async getAuditLogs() {
    return request<any[]>('/api/v1/audit/');
  },
};
