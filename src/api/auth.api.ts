import { apiFetch, apiPost } from './client.ts';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  scopes: string[];
}

export interface SessionResponse {
  authenticated: boolean;
  csrf?: string;
  user?: User;
}

export interface ConsentChallenge {
  consentId: string;
  clientName: string;
  scope: string[];
  resource: string;
  user: { username: string; role: string };
  csrf: string;
}

export async function getSession(): Promise<SessionResponse> {
  return apiFetch<SessionResponse>('/auth/me');
}

export async function register(username: string, password: string): Promise<SessionResponse> {
  return apiPost<SessionResponse>('/auth/register', { username, password });
}

export async function login(username: string, password: string): Promise<SessionResponse> {
  return apiPost<SessionResponse>('/auth/login', { username, password });
}

export async function logout(): Promise<void> {
  await apiPost('/auth/logout', {});
}

export async function getConsentChallenge(consentId: string): Promise<ConsentChallenge> {
  return apiFetch<ConsentChallenge>(`/auth/consent/${consentId}`);
}

export async function submitConsent(
  consentId: string,
  decision: 'allow' | 'deny',
  csrf: string
): Promise<{ redirectTo: string }> {
  return apiPost<{ redirectTo: string }>(`/auth/consent/${consentId}`, { decision, csrf });
}
