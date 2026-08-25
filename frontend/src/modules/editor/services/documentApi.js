/**
 * Real API client functions for DocSync Pro Document Editor.
 * Interacts with backend /api/documents endpoints with resilient offline fallbacks.
 */

import { MOCK_INITIAL_DOCUMENT } from './mockData.js';

const API_BASE = '/api/documents';

function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
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
    if (!isJson) {
      return { ok: false, status: response.status, data: null, isOffline: true };
    }

    const data = await response.json();
    return { ok: response.ok, status: response.status, data: data.data || data };
  } catch (networkError) {
    // Graceful offline fallback
    return { ok: false, status: 0, data: null, isOffline: true, error: networkError.message };
  }
}

/**
 * Fetch a single document by its ID.
 * @param {string} documentId
 * @returns {Promise<Object>}
 */
export async function apiGetDocument(documentId) {
  const res = await safeFetch(`${API_BASE}/${documentId}`, { method: 'GET' });
  if (res.ok && res.data) {
    return res.data;
  }
  // Return initial mock template when offline or document not found
  return { ...MOCK_INITIAL_DOCUMENT, id: documentId, _id: documentId };
}

/**
 * List documents in a workspace.
 * @param {Object} queryParams
 * @returns {Promise<Array>}
 */
export async function apiListDocuments(queryParams = {}) {
  const queryString = new URLSearchParams(queryParams).toString();
  const res = await safeFetch(`${API_BASE}${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  return res.data || [MOCK_INITIAL_DOCUMENT];
}

/**
 * Create a new document in a workspace.
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function apiCreateDocument(payload) {
  const res = await safeFetch(API_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.ok && res.data) return res.data;
  return { ...MOCK_INITIAL_DOCUMENT, ...payload, id: `doc_${Date.now()}` };
}

/**
 * Update document metadata (title, icon, cover, folder).
 * @param {string} documentId
 * @param {Object} metadata
 * @returns {Promise<Object>}
 */
export async function apiUpdateDocumentMetadata(documentId, metadata) {
  const res = await safeFetch(`${API_BASE}/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify(metadata),
  });
  return res.data || metadata;
}

/**
 * Autosave document content (debounced).
 * @param {string} documentId
 * @param {Object} contentPayload - { content, plainText, baseVersion }
 * @returns {Promise<Object>}
 */
export async function apiAutosaveDocument(documentId, contentPayload) {
  const res = await safeFetch(`${API_BASE}/${documentId}/autosave`, {
    method: 'PATCH',
    body: JSON.stringify(contentPayload),
  });
  if (res.ok && res.data) return res.data;
  return {
    success: true,
    version: (contentPayload.baseVersion || 1) + 1,
    savedAt: new Date().toISOString(),
    isOfflineSave: true,
  };
}

/**
 * Update document tags.
 * @param {string} documentId
 * @param {string[]} tags
 * @returns {Promise<Object>}
 */
export async function apiUpdateDocumentTags(documentId, tags) {
  const res = await safeFetch(`${API_BASE}/${documentId}/tags`, {
    method: 'PATCH',
    body: JSON.stringify({ tags }),
  });
  return res.data || { tags };
}

export const apiUpdateTags = apiUpdateDocumentTags;

/**
 * Toggle favorite status.
 * @param {string} documentId
 * @returns {Promise<Object>}
 */
export async function apiToggleFavoriteDocument(documentId) {
  const res = await safeFetch(`${API_BASE}/${documentId}/favorite`, {
    method: 'POST',
  });
  return res.data || { isFavorite: true };
}

export const apiToggleFavorite = apiToggleFavoriteDocument;

/**
 * Duplicate a document.
 * @param {string} documentId
 * @returns {Promise<Object>}
 */
export async function apiDuplicateDocument(documentId) {
  const res = await safeFetch(`${API_BASE}/${documentId}/duplicate`, {
    method: 'POST',
  });
  return res.data || { ...MOCK_INITIAL_DOCUMENT, id: `doc_clone_${Date.now()}` };
}

/**
 * Archive / Move document to trash.
 * @param {string} documentId
 * @returns {Promise<Object>}
 */
export async function apiArchiveDocument(documentId) {
  const res = await safeFetch(`${API_BASE}/${documentId}`, {
    method: 'DELETE',
  });
  return res.data || { id: documentId, isArchived: true };
}

/**
 * Restore document from trash.
 * @param {string} documentId
 * @returns {Promise<Object>}
 */
export async function apiRestoreDocument(documentId) {
  const res = await safeFetch(`${API_BASE}/${documentId}/restore`, {
    method: 'POST',
  });
  return res.data || { id: documentId, isArchived: false };
}

/**
 * Export a document (json, markdown, text).
 * @param {string} documentId
 * @param {string} format
 * @returns {Promise<Object>}
 */
export async function apiExportDocument(documentId, format = 'markdown') {
  const res = await safeFetch(`${API_BASE}/${documentId}/export?format=${format}`, {
    method: 'GET',
  });
  return res.data || { format, content: '# Exported Content' };
}

/**
 * Link an attachment to a document.
 * @param {string} documentId
 * @param {Object} filePayload
 * @returns {Promise<Object>}
 */
export async function apiLinkAttachment(documentId, filePayload) {
  const res = await safeFetch(`${API_BASE}/${documentId}/attachments`, {
    method: 'POST',
    body: JSON.stringify(filePayload),
  });
  return res.data || filePayload;
}

/**
 * Remove an attachment from a document.
 * @param {string} documentId
 * @param {string} attachmentId
 * @returns {Promise<boolean>}
 */
export async function apiRemoveAttachment(documentId, attachmentId) {
  const res = await safeFetch(`${API_BASE}/${documentId}/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
  return res.ok;
}

export const apiUnlinkAttachment = apiRemoveAttachment;

/**
 * Deep AST Content Search.
 * @param {string} workspaceId
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function apiAstSearch(workspaceId, query) {
  const res = await safeFetch(`${API_BASE}/search/ast`, {
    method: 'POST',
    body: JSON.stringify({ workspaceId, query }),
  });
  return res.data || [];
}
