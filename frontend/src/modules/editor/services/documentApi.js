/**
 * @file documentApi.js
 * @description Real REST API client adapter for the DocSync Pro Document Editor.
 * Connects with backend `/api/documents` endpoints with robust offline fallback resilience.
 * @module frontend/src/modules/editor/services/documentApi
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh client service backend API ke `/api/documents` endpoints ke sath communicate karti hai.
 * Network fail hone ya offline hone ki soorat mein graceful fallback data provide karti hai
 * taake editor UI freeze ya crash na ho.
 */

import { MOCK_INITIAL_DOCUMENT } from './mockData.js';

const API_BASE = '/api/documents';

/**
 * Retrieves authentication bearer token headers from browser storage.
 *
 * [ROMAN URDU]:
 * LocalStorage ya SessionStorage se JWT token nikaal kar Bearer Authorization header banata hai.
 *
 * @returns {Object} Request headers
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Resilient fetch wrapper with JSON body parsing and offline safety catch.
 *
 * [ROMAN URDU]:
 * Fetch request wrapper jo network disconnect hone par error throw karne ke bajaye
 * `{ ok: false, isOffline: true }` return karta hai.
 *
 * @param {string} url - Target URL
 * @param {Object} [options={}] - Fetch configuration options
 * @returns {Promise<{ ok: boolean, status: number, data: any, isOffline?: boolean, error?: string }>}
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
      return { ok: false, status: response.status, data: null, isOffline: true };
    }

    const data = await response.json();
    return { ok: response.ok, status: response.status, data: data.data || data };
  } catch (networkError) {
    return { ok: false, status: 0, data: null, isOffline: true, error: networkError.message };
  }
}

/**
 * Fetches a single document by its ID from the backend with offline mock fallback.
 *
 * [ROMAN URDU]:
 * Server se document data lata hai. Agar network na ho toh mock initial template return karta hai.
 *
 * @param {string} documentId - Document ObjectId
 * @returns {Promise<Object>} Document object
 */
export async function apiGetDocument(documentId) {
  const res = await safeFetch(`${API_BASE}/${documentId}`, { method: 'GET' });
  if (res.ok && res.data) {
    return res.data;
  }
  return { ...MOCK_INITIAL_DOCUMENT, id: documentId, _id: documentId };
}

/**
 * Lists documents in a workspace based on provided query filters.
 *
 * [ROMAN URDU]:
 * Workspace ke documents filter aur search query ke sath fetch karta hai.
 *
 * @param {Object} [queryParams={}] - Filter parameters (folderId, tag, search, etc.)
 * @returns {Promise<Array>} List of documents
 */
export async function apiListDocuments(queryParams = {}) {
  const queryString = new URLSearchParams(queryParams).toString();
  const res = await safeFetch(`${API_BASE}${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  return res.data || [MOCK_INITIAL_DOCUMENT];
}

/**
 * Creates a new document on the backend.
 *
 * [ROMAN URDU]:
 * Naya document POST karta hai `/api/documents` par.
 *
 * @param {Object} payload - New document data
 * @returns {Promise<Object>} Created document
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
 * Updates document metadata (title, icon, cover image, folder).
 *
 * [ROMAN URDU]:
 * Document ke metadata fields ko PUT request ke zariye update karta hai.
 *
 * @param {string} documentId - Document ObjectId
 * @param {Object} metadata - Metadata fields
 * @returns {Promise<Object>} Updated metadata or document
 */
export async function apiUpdateDocumentMetadata(documentId, metadata) {
  const res = await safeFetch(`${API_BASE}/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify(metadata),
  });
  return res.data || metadata;
}

/**
 * Autosaves document content (AST + plainText) with baseVersion for OCC tracking.
 *
 * [ROMAN URDU]:
 * Document ka rich-text AST content PATCH karta hai. Base version send karta hai
 * taake backend OCC conflict check kar sake.
 *
 * @param {string} documentId - Document ObjectId
 * @param {Object} contentPayload - { content, plainText, baseVersion }
 * @returns {Promise<Object>} Autosave response
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
 * Updates document tags list.
 *
 * [ROMAN URDU]:
 * Document ke tags update karne ka API call.
 *
 * @param {string} documentId - Document ObjectId
 * @param {string[]} tags - Array of tags
 * @returns {Promise<Object>} Updated tags
 */
export async function apiUpdateDocumentTags(documentId, tags) {
  const res = await safeFetch(`${API_BASE}/${documentId}/tags`, {
    method: 'PUT',
    body: JSON.stringify({ tags }),
  });
  return res.data || { tags };
}

export const apiUpdateTags = apiUpdateDocumentTags;

/**
 * Toggles a user's star/favorite status on a document.
 *
 * [ROMAN URDU]:
 * Document favorite status toggle karne ke liye POST request bhejta hai.
 *
 * @param {string} documentId - Document ObjectId
 * @returns {Promise<Object>} Result object
 */
export async function apiToggleFavoriteDocument(documentId) {
  const res = await safeFetch(`${API_BASE}/${documentId}/favorite`, {
    method: 'POST',
  });
  return res.data || { isFavorite: true };
}

export const apiToggleFavorite = apiToggleFavoriteDocument;

/**
 * Clones / duplicates an existing document.
 *
 * [ROMAN URDU]:
 * Document duplicate karne ka API trigger.
 *
 * @param {string} documentId - Original document ID
 * @returns {Promise<Object>} Cloned document
 */
export async function apiDuplicateDocument(documentId) {
  const res = await safeFetch(`${API_BASE}/${documentId}/duplicate`, {
    method: 'POST',
  });
  return res.data || { ...MOCK_INITIAL_DOCUMENT, id: `doc_clone_${Date.now()}` };
}

/**
 * Moves document to the trash bin (soft-delete).
 *
 * [ROMAN URDU]:
 * Document ko trash bin mein soft-delete karne ka DELETE request.
 *
 * @param {string} documentId - Document ObjectId
 * @returns {Promise<Object>} Result object
 */
export async function apiArchiveDocument(documentId) {
  const res = await safeFetch(`${API_BASE}/${documentId}`, {
    method: 'DELETE',
  });
  return res.data || { id: documentId, isArchived: true };
}

/**
 * Restores an archived document from trash.
 *
 * [ROMAN URDU]:
 * Trash se document restore karne ka POST request.
 *
 * @param {string} documentId - Document ObjectId
 * @returns {Promise<Object>} Result object
 */
export async function apiRestoreDocument(documentId) {
  const res = await safeFetch(`${API_BASE}/${documentId}/restore`, {
    method: 'POST',
  });
  return res.data || { id: documentId, isArchived: false };
}

/**
 * Exports document content in specified format (markdown, json, text).
 *
 * [ROMAN URDU]:
 * Document export download karne ka request.
 *
 * @param {string} documentId - Document ObjectId
 * @param {string} [format='markdown'] - Format ('markdown' | 'json' | 'text')
 * @returns {Promise<Object>} Exported result
 */
export async function apiExportDocument(documentId, format = 'markdown') {
  const res = await safeFetch(`${API_BASE}/${documentId}/export?format=${format}`, {
    method: 'GET',
  });
  return res.data || { format, content: '# Exported Content' };
}

/**
 * Links a file attachment record to a document.
 *
 * [ROMAN URDU]:
 * Document par file attachment link karta hai.
 *
 * @param {string} documentId - Document ObjectId
 * @param {Object} filePayload - File metadata
 * @returns {Promise<Object>} Linked attachment
 */
export async function apiLinkAttachment(documentId, filePayload) {
  const res = await safeFetch(`${API_BASE}/${documentId}/attachments`, {
    method: 'POST',
    body: JSON.stringify(filePayload),
  });
  return res.data || filePayload;
}

export const apiAddAttachment = apiLinkAttachment;

/**
 * Removes an attachment from a document.
 *
 * [ROMAN URDU]:
 * Attachment ko unlink / remove karta hai.
 *
 * @param {string} documentId - Document ObjectId
 * @param {string} attachmentId - Attachment UUID
 * @returns {Promise<boolean>} True if removed successfully
 */
export async function apiRemoveAttachment(documentId, attachmentId) {
  const res = await safeFetch(`${API_BASE}/${documentId}/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
  return res.ok;
}

export const apiUnlinkAttachment = apiRemoveAttachment;

/**
 * Executes deep AST content search on the backend.
 *
 * [ROMAN URDU]:
 * Deep AST search API endpoint ko query karta hai.
 *
 * @param {string} workspaceId - Workspace ObjectId
 * @param {string} query - Search term
 * @returns {Promise<Array>} List of match results
 */
export async function apiAstSearch(workspaceId, query) {
  const res = await safeFetch(`${API_BASE}/search/ast`, {
    method: 'POST',
    body: JSON.stringify({ workspaceId, query }),
  });
  return res.data || [];
}

/**
 * Uploads a physical file to the files module endpoint.
 *
 * [ROMAN URDU]:
 * File upload endpoint (/api/files/upload) par file upload karta hai aur metadata return karta hai.
 *
 * @param {File} file - Browser File object
 * @param {Object} [metadata={}] - Workspace/Folder/Document context
 * @returns {Promise<Object>} Uploaded file descriptor
 */
export async function apiUploadFile(file, metadata = {}) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.workspaceId) formData.append('workspaceId', metadata.workspaceId);
    if (metadata.folderId) formData.append('folderId', metadata.folderId);
    if (metadata.documentId) formData.append('documentId', metadata.documentId);

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return data.data || data;
    }
  } catch (err) {
    console.warn('[Upload File Fallback]:', err);
  }

  // Graceful offline fallback
  return {
    _id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    storageKey: `local_${Date.now()}_${file.name}`,
    downloadUrl: typeof URL !== 'undefined' ? URL.createObjectURL(file) : '#',
  };
}

/**
 * Fetches workspace details for hierarchy breadcrumbs.
 *
 * [ROMAN URDU]:
 * Workspace ID ke mutabiq workspace ka name aur metadata fetch karta hai.
 *
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Object>} Workspace metadata
 */
export async function apiGetWorkspace(workspaceId) {
  const res = await safeFetch(`/api/workspaces/${workspaceId}`, { method: 'GET' });
  return res.data || { id: workspaceId, name: 'Workspace' };
}

/**
 * Fetches folder details for hierarchy breadcrumbs.
 *
 * [ROMAN URDU]:
 * Folder ID ke mutabiq folder ka name aur metadata fetch karta hai.
 *
 * @param {string} folderId - Folder ID
 * @returns {Promise<Object>} Folder metadata
 */
export async function apiGetFolder(folderId) {
  const res = await safeFetch(`/api/folders/${folderId}`, { method: 'GET' });
  return res.data || { id: folderId, name: 'Folder' };
}


