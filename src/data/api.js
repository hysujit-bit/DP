/**
 * api.js — Frontend API client
 * Replaces storage.js localStorage calls with fetch() calls to Netlify Functions.
 * All functions are async. Token is read from localStorage on each call.
 */

const BASE = '/api';

// ─── Token management ─────────────────────────────────────────────────────────
export function getToken()        { return localStorage.getItem('dp_token'); }
export function setToken(t)       { localStorage.setItem('dp_token', t); }
export function clearToken()      { localStorage.removeItem('dp_token'); }

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    // Token expired or invalid — force re-login
    clearToken();
    window.location.href = '/';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const data = await request('/auth', {
    method: 'POST',
    body: { email, password },
  });
  setToken(data.token);
  return data.user;
}

export function logout() {
  clearToken();
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function changePassword(currentPassword, newPassword) {
  return request('/users', {
    method: 'PATCH',
    body: { currentPassword, newPassword },
  });
}

// ─── Workers ──────────────────────────────────────────────────────────────────
export async function getWorkers() {
  return request('/workers');
}

export async function createWorker(data) {
  return request('/workers', { method: 'POST', body: data });
}

export async function updateWorker(id, data) {
  return request(`/workers?id=${id}`, { method: 'PATCH', body: data });
}

export async function deleteWorker(id) {
  return request(`/workers?id=${id}`, { method: 'DELETE' });
}

// ─── Members ──────────────────────────────────────────────────────────────────
export async function getMembers(sukId, includeRemoved = false) {
  const q = includeRemoved ? `sukId=${sukId}&all=1` : `sukId=${sukId}`;
  return request(`/members?${q}`);
}

export async function createMember(data) {
  return request('/members', { method: 'POST', body: data });
}

export async function updateMember(id, data) {
  return request(`/members?id=${id}`, { method: 'PATCH', body: data });
}

export async function removeMember(id, reason, changedBy = null) {
  return request(`/members?id=${id}`, {
    method: 'DELETE',
    body: { reason, changedBy },
  });
}

export async function restoreMember(id) {
  return request(`/members?id=${id}`, {
    method: 'PATCH',
    body: { isActive: true, removedReason: null, removedAt: null },
  });
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export async function getAuditLog(memberId) {
  return request(`/audit?memberId=${memberId}`);
}
export async function getWorkerAuditLog(changedBy) {
  return request(`/audit?changedBy=${changedBy}`);
}
export async function getSukAuditLog(sukId) {
  return request(`/audit?sukId=${sukId}`);
}

// ─── Visits ───────────────────────────────────────────────────────────────────
export async function getVisits(sukId) {
  return request(`/visits?sukId=${sukId}`);
}

export async function addVisit(data) {
  return request('/visits', { method: 'POST', body: data });
}

export async function updateVisit(id, data) {
  return request(`/visits?id=${id}`, { method: 'PATCH', body: data });
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export async function getPayments(sukId) {
  return request(`/payments?sukId=${sukId}`);
}

export async function addPayment(data) {
  return request('/payments', { method: 'POST', body: data });
}

export async function deletePayment(id) {
  return request(`/payments?id=${id}`, { method: 'DELETE' });
}

// ─── Drives ───────────────────────────────────────────────────────────────────
export async function getDrives(sukId) {
  return request(`/drives?sukId=${sukId}`);
}

export async function addDrive(data) {
  return request('/drives', { method: 'POST', body: data });
}

export async function updateDrive(id, data) {
  return request(`/drives?id=${id}`, { method: 'PATCH', body: data });
}

export async function deleteDrive(id) {
  return request(`/drives?id=${id}`, { method: 'DELETE' });
}

// ─── Magazines ────────────────────────────────────────────────────────────────
export async function getMagazineConfig(sukId) {
  return request(`/magazines?sukId=${sukId}&type=config`);
}
export async function getMagazineSubscriptions(sukId, year) {
  const q = year ? `sukId=${sukId}&year=${year}` : `sukId=${sukId}`;
  return request(`/magazines?${q}`);
}
export async function addMagazineConfig(data) {
  return request('/magazines?type=config', { method: 'POST', body: data });
}
export async function updateMagazineConfig(configId, data) {
  return request(`/magazines?configId=${configId}`, { method: 'PATCH', body: data });
}
export async function deleteMagazineConfig(configId) {
  return request(`/magazines?configId=${configId}`, { method: 'DELETE' });
}
export async function upsertSubscription(data) {
  return request('/magazines', { method: 'POST', body: data });
}
export async function updateSubscription(id, data) {
  return request(`/magazines?id=${id}`, { method: 'PATCH', body: data });
}
export async function deleteSubscription(id) {
  return request(`/magazines?id=${id}`, { method: 'DELETE' });
}
