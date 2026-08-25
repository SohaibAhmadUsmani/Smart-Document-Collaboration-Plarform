/**
 * historyModel.js
 * Owner: Aiman
 * 
 * Defines the data structure for document version snapshots and search indexing.
 * Supports in-memory storage fallback for quick local testing as well as MongoDB Mongoose schemas.
 */

// In-memory data store for versions (useful for fast development and testing without a DB requirement)
export const inMemoryVersionStore = [];

/**
 * Creates a formatted Version object record.
 * 
 * @param {Object} params
 * @param {string} params.documentId - The ID of the document this version belongs to.
 * @param {string} params.title - Document title at the time of snapshot.
 * @param {string} params.content - Full document text/content snapshot.
 * @param {string} params.createdBy - User ID or name who created this version.
 * @param {string} [params.changeSummary] - Description of changes made.
 * @returns {Object} A new version snapshot record object.
 */
export function createVersionRecord({ documentId, title, content, createdBy, changeSummary = 'Saved version' }) {
  const documentVersions = inMemoryVersionStore.filter(v => v.documentId === documentId);
  const versionNumber = documentVersions.length + 1;

  const versionRecord = {
    id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    documentId: String(documentId),
    versionNumber,
    title: title || 'Untitled Document',
    content: content || '',
    createdBy: createdBy || 'Anonymous',
    changeSummary,
    createdAt: new Date().toISOString()
  };

  inMemoryVersionStore.push(versionRecord);
  return versionRecord;
}
