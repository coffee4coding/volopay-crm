import type { Lead, LeadFormInput } from './types';
import { getSession, signOut } from './auth';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await getSession();
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    await signOut();
    throw new Error('Session expired — please sign in again');
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface LeadFilters {
  search?: string;
  stage?: string;
  priority?: string;
  source?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export function listLeads(filters: LeadFilters): Promise<{ leads: Lead[] }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  return request(`/api/leads?${params.toString()}`);
}

export function createLead(payload: LeadFormInput): Promise<{ lead: Lead }> {
  return request('/api/leads', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateLead(id: string, payload: Partial<LeadFormInput>): Promise<{ lead: Lead }> {
  return request(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export function deleteLead(id: string): Promise<void> {
  return request(`/api/leads/${id}`, { method: 'DELETE' });
}

export function importLeads(rows: Record<string, unknown>[]): Promise<{ inserted: number; errors: { row: number; error: string }[] }> {
  return request('/api/leads/import', { method: 'POST', body: JSON.stringify({ rows }) });
}
