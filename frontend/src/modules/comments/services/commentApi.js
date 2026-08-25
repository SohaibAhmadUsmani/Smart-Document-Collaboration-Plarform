/**
 * Comment API Service
 *
 * API functions for the backend Comments endpoints.
 * Follows the same fetch pattern as editor/services/documentApi.js.
 */

const API_BASE = '/api/comments';

/**
 * Get auth headers from localStorage/sessionStorage.
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch wrapper with auth and error handling.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
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
      return { ok: false, status: response.status, data: null };
    }

    const json = await response.json();
    return { ok: response.ok, status: response.status, data: json.data ?? json };
  } catch (networkError) {
    return { ok: false, status: 0, data: null, error: networkError.message };
  }
}

/**
 * Create a new comment on a document.
 * @param {Object} payload
 * @param {string} payload.documentId
 * @param {string} payload.body
 * @param {'text_selection' | 'block_node'} payload.anchorType
 * @param {number} payload.from
 * @param {number} payload.to
 * @param {string} [payload.exactQuote]
 * @param {string} [payload.prefixContext]
 * @param {string} [payload.suffixContext]
 * @param {string} [payload.blockId]
 * @param {string[]} [payload.mentions]
 * @param {string} [payload.parentComment]
 * @returns {Promise<Object>}
 */
export async function apiCreateComment(payload) {
  const res = await safeFetch(API_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

/**
 * Get all comments for a document.
 * @param {string} documentId
 * @returns {Promise<Array>}
 */
export async function apiGetDocumentComments(documentId) {
  const res = await safeFetch(`${API_BASE}/document/${documentId}`, { method: 'GET' });
  return res.data || [];
}

/**
 * Get a single comment by ID.
 * @param {string} commentId
 * @returns {Promise<Object>}
 */
export async function apiGetComment(commentId) {
  const res = await safeFetch(`${API_BASE}/${commentId}`, { method: 'GET' });
  return res.data;
}

/**
 * Reply to an existing comment.
 * @param {string} commentId - Parent comment ID
 * @param {Object} payload
 * @param {string} payload.body
 * @param {'text_selection' | 'block_node'} [payload.anchorType]
 * @param {number} [payload.from]
 * @param {number} [payload.to]
 * @param {string[]} [payload.mentions]
 * @returns {Promise<Object>}
 */
export async function apiReplyToComment(commentId, payload) {
  const res = await safeFetch(`${API_BASE}/${commentId}/replies`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

/**
 * Resolve/unresolve a comment thread.
 * @param {string} commentId
 * @returns {Promise<Object>}
 */
export async function apiResolveComment(commentId) {
  const res = await safeFetch(`${API_BASE}/${commentId}/resolve`, {
    method: 'PATCH',
  });
  return res.data;
}

/**
 * Delete a comment.
 * @param {string} commentId
 * @returns {Promise<boolean>}
 */
export async function apiDeleteComment(commentId) {
  const res = await safeFetch(`${API_BASE}/${commentId}`, { method: 'DELETE' });
  return res.ok;
}
