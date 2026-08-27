/**
 * historyApi.js
 * Owner: Aiman
 * 
 * Frontend API client service for Version History and Search REST endpoints.
 */

const BASE_URL = '/api/history-search';

/**
 * Helper to make JSON HTTP requests.
 */
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API Request failed');
  }
  return data;
}

/**
 * Fetches version history for a given document.
 * @param {string} documentId
 */
export async function fetchVersionHistory(documentId) {
  return apiRequest(`/documents/${documentId}/history`);
}

/**
 * Fetches details for a specific version snapshot.
 * @param {string} versionId
 */
export async function fetchVersionDetails(versionId) {
  return apiRequest(`/versions/${versionId}`);
}

/**
 * Creates a new version snapshot for a document.
 * @param {string} documentId
 * @param {Object} data - { title, content, changeSummary, createdBy }
 */
export async function createVersionSnapshot(documentId, data) {
  return apiRequest(`/documents/${documentId}/history`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Restores a document to a previous version snapshot.
 * @param {string} documentId
 * @param {string} versionId
 * @param {string} [restoredBy]
 */
export async function restoreVersion(documentId, versionId, restoredBy) {
  return apiRequest(`/documents/${documentId}/restore/${versionId}`, {
    method: 'POST',
    body: JSON.stringify({ restoredBy }),
  });
}

/**
 * Computes text diff between two version IDs.
 * @param {string} oldVersionId
 * @param {string} newVersionId
 */
export async function fetchVersionDiff(oldVersionId, newVersionId) {
  return apiRequest(`/diff?oldVersionId=${oldVersionId}&newVersionId=${newVersionId}`);
}

/**
 * Performs a global search across documents by keyword.
 * @param {string} query
 */
export async function searchDocuments(query) {
  return apiRequest(`/search?q=${encodeURIComponent(query)}`);
}
