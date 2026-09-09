import { create } from 'zustand';
import { api } from '@/lib/axios';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: any | null;
  activeOrgId: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setActiveOrgId: (orgId: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user: null,
  activeOrgId: typeof window !== "undefined" ? localStorage.getItem("activeOrgId") : null,
  isLoading: true,
  login: (token: string) => {
    localStorage.setItem('token', token);
    set({ token, isLoading: false });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeOrgId');
    set({ token: null, user: null, activeOrgId: null, isLoading: false });
  },
  fetchUser: async () => {
    const { token } = get();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data });
      
      const orgsRes = await api.get("/organizations/");
      const orgs = orgsRes.data;
      
      let currentActiveOrgId = get().activeOrgId;
      if (orgs.length === 0) {
        const createRes = await api.post("/organizations/", { name: `${res.data.full_name || 'My'}'s Workspace` });
        currentActiveOrgId = createRes.data.id;
      } else if (!currentActiveOrgId || !orgs.find((o: any) => o.id === currentActiveOrgId)) {
        currentActiveOrgId = orgs[0].id;
      }

      if (currentActiveOrgId && typeof window !== "undefined") {
        localStorage.setItem("activeOrgId", currentActiveOrgId as string);
      }
      set({ activeOrgId: currentActiveOrgId });

      
    } catch (err) {
      console.error("Failed to fetch user", err);
      set({ token: null, user: null, activeOrgId: null });
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("activeOrgId");
      }
    } finally {
      set({ isLoading: false });
    }
  },
  setActiveOrgId: (orgId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("activeOrgId", orgId);
    }
    set({ activeOrgId: orgId });
  }
}));
