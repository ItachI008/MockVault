export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type AuthMode = 'login' | 'register';
export type AuthRequirement = 'None' | 'Bearer' | 'API Key';

export interface SchemaDefinition {
  _id: string;
  name: string;
  projectId: string;
  openapiSpec: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockEndpoint {
  _id: string;
  schemaId: string;
  schemaName?: string;
  path: string;
  method: HttpMethod;
  operationId?: string;
  summary?: string;
  responseStatus: string;
  latencyMs: number;
  errorRate: number;
  isActive: boolean;
  authRequired: AuthRequirement;
  createdAt: string;
  updatedAt: string;
}

export interface ContractReportItem {
  endpointId: string;
  method: HttpMethod;
  path: string;
  schemaName: string;
  status: 'PASS' | 'FAIL';
  message: string;
  latencyMs: number;
}

export interface ContractReport {
  passRate: number;
  total: number;
  passed: number;
  failed: number;
  results: ContractReportItem[];
}

export interface DashboardResponse {
  metrics: {
    schemaCount: number;
    endpointCount: number;
    activeEndpointCount: number;
    contractPassRate: number;
  };
  endpoints: MockEndpoint[];
  contractReport: ContractReport;
}

export interface AuthResponse {
  token?: string;
  requiresVerification?: boolean;
  email?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    isOnboarded: boolean;
  };
}

export interface Workspace {
  _id: string;
  name: string;
  ownerId: string;
  role: string;
}

export interface WorkspaceMember {
  _id: string;
  workspaceId: string;
  userId: string;
  email: string;
  fullName: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface SchemaVersion {
  _id: string;
  schemaId: string;
  name: string;
  version: string;
  openapiSpec: string;
  snapshotAt: string;
  changeNote?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
const TOKEN_KEY = 'mockvault_token';

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem(TOKEN_KEY);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      // Keep the HTTP status text when the server did not send JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
};

export const resolvePreviewPath = (path: string) => {
  const resolved = path.replace(/\{([^}]+)\}/g, (_match, key) => `demo-${key}`);
  return resolved.startsWith('/') ? resolved : `/${resolved}`;
};

export const api = {
  getHealth: () => request<{ status: string; service: string }>('/health'),
  getDashboard: () => request<DashboardResponse>('/dashboard'),
  getSchemas: () => request<SchemaDefinition[]>('/schemas'),
  getSchema: (id: string) => request<{ schema: SchemaDefinition; endpoints: MockEndpoint[] }>(`/schemas/${id}`),
  getSchemaVersions: (id: string) => request<SchemaVersion[]>(`/schemas/${id}/versions`),
  rollbackSchemaVersion: (id: string, versionId: string) =>
    request<{ schema: SchemaDefinition; endpoints: MockEndpoint[] }>(`/schemas/${id}/rollback/${versionId}`, {
      method: 'POST',
    }),
  saveSchema: (payload: { name: string; version: string; openapiSpec: string; changeNote?: string }, id?: string) =>
    request<{ schema: SchemaDefinition; endpoints: MockEndpoint[] }>(id ? `/schemas/${id}` : '/schemas', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    }),
  getMocks: () => request<MockEndpoint[]>('/mocks'),
  updateMock: (id: string, payload: Partial<Pick<MockEndpoint, 'latencyMs' | 'errorRate' | 'isActive' | 'authRequired'>>) =>
    request<MockEndpoint>(`/mocks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getMockPreview: (endpoint: MockEndpoint) =>
    request<unknown>(`/mocks/live${encodeURI(resolvePreviewPath(endpoint.path))}`, { method: endpoint.method }),
  getContractReport: () => request<ContractReport>('/contracts/report'),
  authenticate: (mode: AuthMode, payload: { fullName?: string; email: string; password: string }) =>
    request<AuthResponse>(`/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  verifyOtp: (payload: { email: string; otp: string }) =>
    request<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (payload: { email: string; otp: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  completeOnboarding: (payload: { workspaceName: string }) =>
    request<AuthResponse['user']>('/auth/complete-onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getWorkspaces: () => request<Workspace[]>('/workspaces'),
  getWorkspaceMembers: (workspaceId: string) => request<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),
  inviteWorkspaceMember: (workspaceId: string, email: string, role: string) =>
    request<WorkspaceMember>(`/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  updateWorkspaceMember: (workspaceId: string, memberId: string, role: string) =>
    request<WorkspaceMember>(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  removeWorkspaceMember: (workspaceId: string, memberId: string) =>
    request<void>(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'DELETE',
    }),
};

export const saveAuthSession = (auth: AuthResponse) => {
  if (auth.token) localStorage.setItem(TOKEN_KEY, auth.token);
  if (auth.user) localStorage.setItem('mockvault_user', JSON.stringify(auth.user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('mockvault_user');
};

export const hasAuthSession = () => Boolean(localStorage.getItem(TOKEN_KEY));

export const getStoredUser = (): AuthResponse['user'] | null => {
  try {
    const raw = localStorage.getItem('mockvault_user');
    return raw ? (JSON.parse(raw) as AuthResponse['user']) : null;
  } catch {
    return null;
  }
};
