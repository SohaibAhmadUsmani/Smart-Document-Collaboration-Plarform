const API_BASE = import.meta.env?.VITE_API_URL || '';
const FILES_BASE = `${API_BASE}/api/files`;
const DASHBOARD_BASE = `${API_BASE}/api/dashboard`;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000);
  const signal = options.signal || controller.signal;

  try {
    const response = await fetch(url, {
      ...options,
      signal,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json().catch(() => null) : null;
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return { ok: false, status: response.status, data, error: data?.message || `Request failed with status ${response.status}` };
    }
    return { ok: true, status: response.status, data };
  } catch (error) {
    clearTimeout(timeoutId);
    const isTimeout = error.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      data: null,
      error: isTimeout ? 'Request timed out' : error.message,
      isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false
    };
  }
}

export async function getDashboard(workspaceId) {
  return safeFetch(`${DASHBOARD_BASE}?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function listFiles(workspaceId, folderId) {
  const params = new URLSearchParams({ workspaceId });
  if (folderId) params.set('folderId', folderId);
  return safeFetch(`${FILES_BASE}?${params.toString()}`);
}

export async function uploadFile({ file, workspaceId, folderId, documentId }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('workspaceId', workspaceId);
  if (folderId) formData.append('folderId', folderId);
  if (documentId) formData.append('documentId', documentId);

  return safeFetch(`${FILES_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
}

export async function renameFile(fileId, fileName) {
  return safeFetch(`${FILES_BASE}/${fileId}/rename`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName }),
  });
}

export async function moveFile(fileId, folderId) {
  return safeFetch(`${FILES_BASE}/${fileId}/move`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId }),
  });
}

export async function duplicateFile(fileId, folderId) {
  return safeFetch(`${FILES_BASE}/${fileId}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId: folderId || null }),
  });
}

export async function deleteFile(fileId) {
  return safeFetch(`${FILES_BASE}/${fileId}`, {
    method: 'DELETE',
  });
}

export function getDownloadUrl(storageKey) {
  return `${FILES_BASE}/download/${storageKey}`;
}