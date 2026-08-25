/**
 * historyService.js
 * Owner: Aiman
 * 
 * Business logic layer for Version History & Global Search operations.
 */

import { inMemoryVersionStore, createVersionRecord } from './historyModel.js';

/**
 * Creates a new version snapshot for a document.
 */
export async function createSnapshot({ documentId, title, content, createdBy, changeSummary }) {
  if (!documentId) {
    throw new Error('documentId is required to create a version snapshot');
  }

  const newVersion = createVersionRecord({
    documentId,
    title,
    content,
    createdBy,
    changeSummary: changeSummary || 'Manual version snapshot'
  });

  return newVersion;
}

/**
 * Retrieves the full version history list for a document.
 */
export async function getHistoryByDocumentId(documentId) {
  if (!documentId) {
    throw new Error('documentId is required');
  }

  const versions = inMemoryVersionStore
    .filter(v => v.documentId === String(documentId))
    .sort((a, b) => b.versionNumber - a.versionNumber); // Latest first

  return versions;
}

/**
 * Retrieves a single version snapshot by its unique ID.
 */
export async function getVersionDetails(versionId) {
  const version = inMemoryVersionStore.find(v => v.id === String(versionId));
  if (!version) {
    const error = new Error(`Version with ID '${versionId}' not found`);
    error.statusCode = 404;
    throw error;
  }

  return version;
}

/**
 * Restores a past document version non-destructively.
 * Copies the old version's content and creates a NEW version snapshot marked as restored.
 */
export async function restoreVersionSnapshot(documentId, versionId, restoredBy = 'System User') {
  const targetVersion = await getVersionDetails(versionId);

  if (targetVersion.documentId !== String(documentId)) {
    const error = new Error('Version does not belong to the specified document');
    error.statusCode = 400;
    throw error;
  }

  // Create a brand new version snapshot with the old content (non-destructive)
  const restoredVersion = createVersionRecord({
    documentId,
    title: targetVersion.title,
    content: targetVersion.content,
    createdBy: restoredBy,
    changeSummary: `Restored from Version #${targetVersion.versionNumber}`
  });

  return restoredVersion;
}

/**
 * Calculates a line-by-line text difference between two string contents.
 */
export async function calculateDiff(oldVersionId, newVersionId) {
  const oldVersion = await getVersionDetails(oldVersionId);
  const newVersion = await getVersionDetails(newVersionId);

  const oldLines = (oldVersion.content || '').split('\n');
  const newLines = (newVersion.content || '').split('\n');

  const diff = [];
  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === newLine) {
      diff.push({ type: 'unchanged', text: oldLine });
    } else {
      if (oldLine !== undefined) {
        diff.push({ type: 'removed', text: oldLine });
      }
      if (newLine !== undefined) {
        diff.push({ type: 'added', text: newLine });
      }
    }
  }

  return {
    oldVersionId,
    newVersionId,
    diff
  };
}

/**
 * Performs a global search across all version snapshots by keyword matching.
 */
export async function searchAllDocuments(query) {
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();

  // Search through version snapshots matching title, content, or summary
  const matches = inMemoryVersionStore.filter(version => {
    const titleMatch = version.title.toLowerCase().includes(searchTerm);
    const contentMatch = version.content.toLowerCase().includes(searchTerm);
    const summaryMatch = version.changeSummary.toLowerCase().includes(searchTerm);
    return titleMatch || contentMatch || summaryMatch;
  });

  // Group by documentId and return the latest matching version for each document
  const resultMap = new Map();
  matches.forEach(item => {
    if (!resultMap.has(item.documentId) || resultMap.get(item.documentId).versionNumber < item.versionNumber) {
      resultMap.set(item.documentId, {
        documentId: item.documentId,
        matchedVersionId: item.id,
        versionNumber: item.versionNumber,
        title: item.title,
        matchedContentSnippet: item.content.slice(0, 150),
        updatedAt: item.createdAt
      });
    }
  });

  return Array.from(resultMap.values());
}
