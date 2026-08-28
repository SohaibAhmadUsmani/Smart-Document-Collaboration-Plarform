const FILES_BASE = '/api/files';
const DASHBOARD_BASE = '/api/dashboard';

function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;
    if (!response.ok) {
      return { ok: false, status: response.status, data, error: data?.message || 'Request failed' };
    }
    return { ok: true, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: null, error: error.message, isOffline: true };
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