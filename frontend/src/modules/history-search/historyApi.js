/**
 * @fileoverview Frontend API client service for Version History and Search REST endpoints.
 * Handles authenticated communication with the backend history-search API module.
 *
 * Version History aur Search REST endpoints ke liye frontend API client service.
 * Backend history-search module ke sath authenticated requests bhejne aur response process karne ka kaam karta hai.
 */

const BASE_URL = '/api/history-search';

/**
 * Helper function to execute JSON HTTP requests with automatic Bearer token injection.
 * Reads authentication token from localStorage (with fallback to sessionStorage).
 *
 * JSON HTTP requests bhejne ke liye helper function jo automatically Authorization header mein Bearer token shamil karta hai.
 * Yeh token pehle localStorage se (aur fallback ke taur par sessionStorage se) hasil karta hai.
 *
 * @param {string} endpoint - The API endpoint relative to BASE_URL (e.g. '/documents/:id/history'). / BASE_URL ke mutabiq relative API endpoint path.
 * @param {RequestInit} [options={}] - Standard Fetch API request configuration options. / Fetch API ke options jaise method, headers, ya body.
 * @returns {Promise<any>} The parsed JSON response data. / Server se parse shuda JSON response data.
 * @throws {Error} When HTTP response status is not ok. / Agar server error status return kare to error throw hota hai.
 */
async function apiRequest(endpoint, options = {}) {
  const token = (typeof localStorage !== 'undefined' && localStorage.getItem('token')) ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('token')) || null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API Request failed');
  }
  return data;
}

/**
 * Fetches the chronological version history list for a specific document.
 *
 * Kisi makhsoos document ki pichli versions ki tareekh (history) fetch karta hai.
 *
 * @param {string} documentId - Unique identifier of the document. / Document ki unique ID.
 * @returns {Promise<Array<Object>>} List of historical version metadata summaries. / Versions ki list ka promise.
 */
export async function fetchVersionHistory(documentId) {
  return apiRequest(`/documents/${documentId}/history`);
}

/**
 * Fetches full details and snapshot content for a specific version.
 *
 * Kisi specific version snapshot ki mukammal tafseelaat aur content hasil karta hai.
 *
 * @param {string} versionId - Unique identifier of the version snapshot. / Version snapshot ki unique ID.
 * @returns {Promise<Object>} The complete version details object. / Version ki mukammal details ka object.
 */
export async function fetchVersionDetails(versionId) {
  return apiRequest(`/versions/${versionId}`);
}

/**
 * Creates and persists a new manual or automated version snapshot for a document.
 *
 * Kisi document ke liye aik naya manual ya automated version snapshot create aur save karta hai.
 *
 * @param {string} documentId - Unique identifier of the document. / Document ki unique ID.
 * @param {{ title: string, content: any, changeSummary?: string, createdBy?: string }} data - Snapshot payload. / Version data payload.
 * @returns {Promise<Object>} The newly created version record. / Naye version record ka object.
 */
export async function createVersionSnapshot(documentId, data) {
  return apiRequest(`/documents/${documentId}/history`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Restores a document to the state of a previously recorded version snapshot.
 *
 * Document ko uske kisi pichlay version snapshot ki halat par wapis restore (bahal) karta hai.
 *
 * @param {string} documentId - Unique identifier of the document. / Document ki unique ID.
 * @param {string} versionId - The version snapshot identifier to restore from. / Jis version par restore karna ho uski ID.
 * @param {string} [restoredBy] - User ID of the collaborator performing the restore action. / Restore action perform karne wale user ki ID.
 * @returns {Promise<Object>} The updated document and restoration audit trail. / Restored document aur result data.
 */
export async function restoreVersion(documentId, versionId, restoredBy) {
  return apiRequest(`/documents/${documentId}/restore/${versionId}`, {
    method: 'POST',
    body: JSON.stringify({ restoredBy }),
  });
}

/**
 * Permanently deletes a specific historical version snapshot.
 *
 * Kisi makhsoos version snapshot ko mustaqil taur par delete karta hai.
 *
 * @param {string} versionId - The version identifier to delete. / Delete karne ke liye version ID.
 * @returns {Promise<{ success: boolean, message: string }>} Deletion status acknowledgment. / Deletion ka result.
 */
export async function deleteVersionSnapshot(versionId) {
  return apiRequest(`/versions/${versionId}`, {
    method: 'DELETE',
  });
}

/**
 * Computes a visual/textual difference (diff) between two historical version snapshots.
 *
 * Do mukhtalif version snapshots ke darmiyan farq (diff) maloom karta hai.
 *
 * @param {string} oldVersionId - The baseline/older version ID. / Purani version snapshot ki ID.
 * @param {string} newVersionId - The newer comparison version ID. / Nayi version snapshot ki ID.
 * @returns {Promise<Object>} Diff payload containing additions, deletions, and unchanged parts. / Diff ka tafseeli data.
 */
export async function fetchVersionDiff(oldVersionId, newVersionId) {
  return apiRequest(`/diff?oldVersionId=${oldVersionId}&newVersionId=${newVersionId}`);
}

/**
 * Performs a global text search across accessible documents by keyword query.
 *
 * Documents ke andar search keyword ke zariye global search run karta hai.
 *
 * @param {string} query - The search query term. / Search karne ke liye keyword ya query.
 * @returns {Promise<Array<Object>>} Matching document search results. / Match hone wale search results.
 */
export async function searchDocuments(query) {
  return apiRequest(`/search?q=${encodeURIComponent(query)}`);
}
