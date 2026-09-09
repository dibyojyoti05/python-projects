const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export function getAuthToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export function getStreamUrl(cameraId: number): string {
  const token = getAuthToken();
  const base = `${API_URL}/streams/${cameraId}/stream`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

export function getSnapshotUrl(cameraId: number): string {
  const token = getAuthToken();
  const base = `${API_URL}/streams/${cameraId}/snapshot`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

// ---------------- CAMERAS ----------------
export async function fetchCameras() {
  const res = await fetch(`${API_URL}/cameras/`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Failed to fetch cameras');
  return res.json();
}

export async function fetchCamera(id: number) {
  const res = await fetch(`${API_URL}/cameras/${id}`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error(`Failed to fetch camera #${id}`);
  return res.json();
}

export async function createCamera(data: {
  name: string;
  location?: string;
  rtsp_url: string;
  ai_enabled?: boolean;
}) {
  const res = await fetch(`${API_URL}/cameras/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create camera');
  return res.json();
}

export async function updateCamera(id: number, data: Partial<{
  name: string;
  location: string;
  rtsp_url: string;
  ai_enabled: boolean;
  is_active: boolean;
}>) {
  const res = await fetch(`${API_URL}/cameras/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Failed to update camera #${id}`);
  return res.json();
}

export async function deleteCamera(id: number) {
  const res = await fetch(`${API_URL}/cameras/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error(`Failed to delete camera #${id}`);
  return res.json();
}

export async function toggleCameraAi(id: number) {
  const res = await fetch(`${API_URL}/cameras/${id}/toggle-ai`, {
    method: 'POST',
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error(`Failed to toggle AI for camera #${id}`);
  return res.json();
}

// ---------------- STREAMS ----------------
export async function startStream(cameraId: number) {
  const res = await fetch(`${API_URL}/streams/${cameraId}/start`, {
    method: 'POST',
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error(`Failed to start stream #${cameraId}`);
  return res.json();
}

export async function stopStream(cameraId: number) {
  const res = await fetch(`${API_URL}/streams/${cameraId}/stop`, {
    method: 'POST',
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error(`Failed to stop stream #${cameraId}`);
  return res.json();
}

export async function fetchActiveStreams() {
  const res = await fetch(`${API_URL}/streams/active`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) return { active_camera_ids: [] };
  return res.json();
}

// ---------------- EVENTS & ANALYTICS ----------------
export async function fetchEvents(params?: {
  limit?: number;
  skip?: number;
  cameraId?: number;
  objectClass?: string;
  minConfidence?: number;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.append('limit', String(params.limit));
  if (params?.skip) searchParams.append('skip', String(params.skip));
  if (params?.cameraId) searchParams.append('camera_id', String(params.cameraId));
  if (params?.objectClass) searchParams.append('object_class', params.objectClass);
  if (params?.minConfidence) searchParams.append('min_confidence', String(params.minConfidence));
  if (params?.search) searchParams.append('search', params.search);

  const res = await fetch(`${API_URL}/events/?${searchParams.toString()}`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function fetchEventsSummary() {
  const res = await fetch(`${API_URL}/events/stats/summary`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Failed to fetch stats summary');
  return res.json();
}

export async function fetchHourlyStats() {
  const res = await fetch(`${API_URL}/events/stats/hourly`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Failed to fetch hourly stats');
  return res.json();
}

export async function fetchClassesStats() {
  const res = await fetch(`${API_URL}/events/stats/classes`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Failed to fetch classes stats');
  return res.json();
}

// ---------------- SYSTEM ----------------
export async function fetchSystemHealth() {
  const res = await fetch(`${API_URL}/system/health`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Failed to fetch system health');
  return res.json();
}

// ---------------- AUTH ----------------
export async function login(username: string, password: string) {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json();
}

export async function fetchCurrentUser() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}
