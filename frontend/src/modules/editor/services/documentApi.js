/**
 * Real API client functions for Document Editor.
 * Interacts with backend /api/documents endpoints.
 */

const API_BASE = '/api/documents';

/**
 * Fetch a single document by its ID.
 * @param {string} documentId
 * @returns {Promise<Object>}
 */
export async function apiGetDocument(documentId) {
  const response = await fetch(`${API_BASE}/${documentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to fetch document: ${response.statusText}`);
  }

  return data.data;
}

/**
 * Create a new document in a workspace.
 * @param {Object} payload - { workspaceId, folderId, title, content }
 * @returns {Promise<Object>}
 */
export async function apiCreateDocument(payload) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to create document: ${response.statusText}`);
  }

  return data.data;
}

/**
 * Update document metadata (title, icon, cover, folder).
 * @param {string} documentId
 * @param {Object} metadata - { title, icon, coverImage, folderId }
 * @returns {Promise<Object>}
 */
export async function apiUpdateDocumentMetadata(documentId, metadata) {
  const response = await fetch(`${API_BASE}/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to update document: ${response.statusText}`);
  }

  return data.data;
}

/**
 * Autosave rich-text JSON content and optional plainText.
 * @param {string} documentId
 * @param {Object} contentPayload - { content, plainText }
 * @returns {Promise<Object>}
 */
export async function apiAutosaveDocument(documentId, contentPayload) {
  const response = await fetch(`${API_BASE}/${documentId}/autosave`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contentPayload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to autosave document: ${response.statusText}`);
  }

  return data.data;
}

/**
 * Move document to archive / trash.
 * @param {string} documentId
 * @returns {Promise<boolean>}
 */
export async function apiArchiveDocument(documentId) {
  const response = await fetch(`${API_BASE}/${documentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to archive document: ${response.statusText}`);
  }

  return true;
}

/**
 * List documents in a workspace with optional filters.
 * @param {string} workspaceId
 * @param {Object} [filters] - { folderId, page, limit }
 * @returns {Promise<{ documents: Array, pagination: Object }>}
 */
export async function apiListDocuments(workspaceId, filters = {}) {
  const params = new URLSearchParams({ workspaceId });

  if (filters.folderId) params.append('folderId', filters.folderId);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const response = await fetch(`${API_BASE}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to list documents: ${response.statusText}`);
  }

  return {
    documents: data.data,
    pagination: data.pagination,
  };
}
