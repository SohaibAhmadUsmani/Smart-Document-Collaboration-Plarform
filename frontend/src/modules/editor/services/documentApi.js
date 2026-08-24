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
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to fetch document: ${response.statusText}`);
  }

  return data.data;
}

/**
 * Create a new document in a workspace.
 * @param {Object} payload - { workspaceId, folderId, title, content, tags }
 * @returns {Promise<Object>}
 */
export async function apiCreateDocument(payload) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contentPayload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to autosave document: ${response.statusText}`);
  }

  return data.data;
}

/**
 * Toggle favorite/star on a document.
 * @param {string} documentId
 * @returns {Promise<{ isFavorited: boolean, favoriteCount: number }>}
 */
export async function apiToggleFavorite(documentId) {
  const response = await fetch(`${API_BASE}/${documentId}/favorite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to toggle favorite');
  }

  return data.data;
}

/**
 * Update document tags.
 * @param {string} documentId
 * @param {string[]} tags
 * @returns {Promise<Object>}
 */
export async function apiUpdateTags(documentId, tags) {
  const response = await fetch(`${API_BASE}/${documentId}/tags`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update tags');
  }

  return data.data;
}

/**
 * Get unique tags across a workspace.
 * @param {string} workspaceId
 * @returns {Promise<Array<{ tag: string, count: number }>>}
 */
export async function apiGetWorkspaceTags(workspaceId) {
  const response = await fetch(`${API_BASE}/meta/tags?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tags');
  }

  return data.data;
}

/**
 * Link an attachment record to a document.
 * @param {string} documentId
 * @param {Object} filePayload
 * @returns {Promise<Object>}
 */
export async function apiLinkAttachment(documentId, filePayload) {
  const response = await fetch(`${API_BASE}/${documentId}/attachments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filePayload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to link attachment');
  }

  return data.data;
}

/**
 * Unlink an attachment from a document.
 * @param {string} documentId
 * @param {string} attachmentId
 * @returns {Promise<boolean>}
 */
export async function apiUnlinkAttachment(documentId, attachmentId) {
  const response = await fetch(`${API_BASE}/${documentId}/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to unlink attachment');
  }

  return true;
}

/**
 * Execute deep AST content search.
 * @param {Object} searchPayload - { workspaceId, query, nodeTypes, tags, limit }
 * @returns {Promise<Array>}
 */
export async function apiAstSearch(searchPayload) {
  const response = await fetch(`${API_BASE}/search/ast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(searchPayload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to search AST content');
  }

  return data.data;
}

/**
 * Execute multi-document batch operations.
 * @param {'archive' | 'restore' | 'move' | 'tag' | 'duplicate' | 'delete_permanent'} action
 * @param {string[]} documentIds
 * @param {Object} [payload]
 * @returns {Promise<{ succeeded: string[], failed: Array<{ id: string, reason: string }> }>}
 */
export async function apiBatchOperation(action, documentIds, payload = {}) {
  const response = await fetch(`${API_BASE}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, documentIds, payload }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to execute batch operation');
  }

  return data.data;
}

/**
 * Duplicate / clone an existing document.
 * @param {string} documentId
 * @returns {Promise<Object>}
 */
export async function apiDuplicateDocument(documentId) {
  const response = await fetch(`${API_BASE}/${documentId}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to duplicate document: ${response.statusText}`);
  }

  return data.data;
}

/**
 * Export document content in markdown, json, or text.
 * @param {string} documentId
 * @param {string} [format='markdown']
 */
export async function apiExportDocument(documentId, format = 'markdown') {
  const response = await fetch(`${API_BASE}/${documentId}/export?format=${format}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to export document: ${response.statusText}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  let filename = `document.${format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'txt'}`;

  if (disposition && disposition.includes('filename=')) {
    const matches = disposition.match(/filename="?([^"]+)"?/);
    if (matches && matches[1]) filename = matches[1];
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Retrieve document word and reading statistics.
 * @param {string} documentId
 * @returns {Promise<Object>}
 */
export async function apiGetDocumentStats(documentId) {
  const response = await fetch(`${API_BASE}/${documentId}/stats`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to fetch document stats: ${response.statusText}`);
  }

  return data.data;
}

/**
 * Move document to trash.
 * @param {string} documentId
 * @returns {Promise<boolean>}
 */
export async function apiArchiveDocument(documentId) {
  const response = await fetch(`${API_BASE}/${documentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to archive document: ${response.statusText}`);
  }

  return true;
}

/**
 * Restore document from trash.
 * @param {string} documentId
 * @param {string|null} [targetFolderId=null]
 * @returns {Promise<Object>}
 */
export async function apiRestoreDocument(documentId, targetFolderId = null) {
  const response = await fetch(`${API_BASE}/${documentId}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetFolderId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to restore document');
  }

  return data.data;
}

/**
 * List documents in trash for a workspace.
 * @param {string} workspaceId
 * @param {Object} [pagination]
 * @returns {Promise<{ documents: Array, pagination: Object }>}
 */
export async function apiListTrash(workspaceId, pagination = {}) {
  const params = new URLSearchParams({ workspaceId });
  if (pagination.page) params.append('page', pagination.page);
  if (pagination.limit) params.append('limit', pagination.limit);

  const response = await fetch(`${API_BASE}/trash?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to list trash');
  }

  return {
    documents: data.data,
    pagination: data.pagination,
  };
}

/**
 * List active documents in a workspace.
 * @param {string} workspaceId
 * @param {Object} [filters]
 * @returns {Promise<{ documents: Array, pagination: Object }>}
 */
export async function apiListDocuments(workspaceId, filters = {}) {
  const params = new URLSearchParams({ workspaceId });

  if (filters.folderId) params.append('folderId', filters.folderId);
  if (filters.tag) params.append('tag', filters.tag);
  if (filters.favorited) params.append('favorited', filters.favorited);
  if (filters.search) params.append('search', filters.search);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const response = await fetch(`${API_BASE}?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
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
