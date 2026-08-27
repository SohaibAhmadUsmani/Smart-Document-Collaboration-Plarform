/**
 * historyModel.js
 * Owner: Aiman
 * 
 * Defines the data structure for document version snapshots and search indexing.
 * Pre-populated with dummy seed data for testing Version History & Search features.
 */

// In-memory data store for versions pre-populated with initial sample version history
export const inMemoryVersionStore = [
  {
    id: 'ver_seed_101',
    documentId: 'doc_123',
    versionNumber: 1,
    title: 'Project Architectural Proposal',
    content: 'This is the initial draft of the smart document collaboration project architecture proposal created by Aiman.',
    createdBy: 'Aiman',
    changeSummary: 'Initial project outline & architecture draft',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
  },
  {
    id: 'ver_seed_102',
    documentId: 'doc_123',
    versionNumber: 2,
    title: 'Project Architectural Proposal (V2)',
    content: 'This is the updated version of the document with Section 6 Version History requirements added.',
    createdBy: 'Aiman',
    changeSummary: 'Added Version History requirements & API specs',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString() // 1 day ago
  },
  {
    id: 'ver_seed_103',
    documentId: 'doc_456',
    versionNumber: 1,
    title: 'Sprint Planning Meeting Notes',
    content: 'Notes from the project kickoff meeting with all module team members.',
    createdBy: 'Maira',
    changeSummary: 'Initial sprint meeting notes',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString() // 5 hours ago
  }
];

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
  const documentVersions = inMemoryVersionStore.filter(v => v.documentId === String(documentId));
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
