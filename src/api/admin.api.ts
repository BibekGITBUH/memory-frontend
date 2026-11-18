import { apiFetch, apiPost, apiDelete } from './client.ts';

export interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
}

export interface CreateApiKeyRequest {
  name: string;
  scopes: ('memory:read' | 'memory:write')[];
  expiresInDays?: number | null;
}

export interface CreateApiKeyResponse extends ApiKey {
  key: string;
  note: string;
}

export interface StatsResponse {
  totalMemories: number;
  activeApiKeys: number;
  totalApiKeys: number;
}

export interface Memory {
  id: string;
  content: string;
  createdAt: string;
}

export interface MemoriesResponse {
  total: number;
  page: number;
  limit: number;
  memories: Memory[];
}

export async function getStats(csrf: string): Promise<StatsResponse> {
  return apiFetch<StatsResponse>('/admin/stats', { headers: { 'X-CSRF-Token': csrf } });
}

export async function getApiKeys(csrf: string): Promise<ApiKey[]> {
  return apiFetch<ApiKey[]>('/admin/api-keys', { headers: { 'X-CSRF-Token': csrf } });
}

export async function createApiKey(data: CreateApiKeyRequest, csrf: string): Promise<CreateApiKeyResponse> {
  return apiPost<CreateApiKeyResponse>('/admin/api-keys', data, csrf);
}

export async function revokeApiKey(id: string, csrf: string): Promise<{ revoked: boolean }> {
  return apiDelete<{ revoked: boolean }>(`/admin/api-keys/${id}`, csrf);
}

export async function getMemories(params: { page?: number; limit?: number; search?: string }, csrf: string): Promise<MemoriesResponse> {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.search) sp.set('search', params.search);
  return apiFetch<MemoriesResponse>(`/admin/memories?${sp}`, { headers: { 'X-CSRF-Token': csrf } });
}

export async function deleteMemory(id: string, csrf: string): Promise<{ deleted: boolean }> {
  return apiDelete<{ deleted: boolean }>(`/admin/memories/${id}`, csrf);
}
