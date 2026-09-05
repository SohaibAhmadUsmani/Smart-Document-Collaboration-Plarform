/**
 * historyService.js
 * Owner: Aiman
 * 
 * Business logic layer for Version History & Global Search operations.
 */

import mongoose from 'mongoose';
import { inMemoryVersionStore, createVersionRecord, VersionModel } from './historyModel.js';
import { DocumentModel } from '../documents/document.model.js';
import { Folder } from '../workspaces/models/Folder.js';
import { FileModel } from '../files-dashboard/file.model.js';
import { escapeRegex } from '../documents/documentAstSearch.service.js';
import { documentEvents, DOCUMENT_EVENTS } from '../documents/document.events.js';

// Auto-Snapshot Checkpoint Event Listener
// Subscribes to milestone checkpoints (e.g. every 25 edits) and creates automatic immutable snapshots
documentEvents.on(DOCUMENT_EVENTS.SNAPSHOT_CHECKPOINT_CREATED, async (data) => {
  try {
    const docId = data?.documentId || data?.id;
    if (!docId) return;

    await createSnapshot({
      documentId: String(docId),
      title: data.title || 'Untitled Document',
      content: data.content ?? data.plainText ?? '',
      createdBy: String(data.actorId || data.userId || 'Auto-Checkpoint System'),
      changeSummary: `Automated checkpoint (version ${data.version || 'milestone'})`,
    });
  } catch (err) {
    console.error('[History Service]: Failed to capture auto-snapshot checkpoint:', err.message);
  }
});

/**
 * Creates a new version snapshot for a document.
 */
export async function createSnapshot({ documentId, title, content, createdBy, changeSummary }) {
  if (!documentId) {
    throw new Error('documentId is required to create a version snapshot');
  }

  const newVersion = await createVersionRecord({
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

  if (mongoose.connection?.readyState === 1) {
    try {
      const dbVersions = await VersionModel.find({ documentId: String(documentId) })
        .sort({ versionNumber: -1 })
        .lean();
      if (dbVersions && dbVersions.length > 0) {
        return dbVersions.map(v => ({
          ...v,
          id: v._id ? v._id.toString() : v.id
        }));
      }
    } catch {
      // Fallback to in-memory store
    }
  }

  let versions = inMemoryVersionStore
    .filter(v => v.documentId === String(documentId))
    .sort((a, b) => b.versionNumber - a.versionNumber); // Latest first

  if (versions.length === 0) {
    await createVersionRecord({
      documentId: String(documentId),
      title: 'Untitled Document',
      content: 'Initial document snapshot',
      createdBy: 'Aiman (System)',
      changeSummary: 'Auto-created initial document version'
    });
    versions = inMemoryVersionStore
      .filter(v => v.documentId === String(documentId))
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  return versions;
}

/**
 * Retrieves a single version snapshot by its unique ID.
 */
export async function getVersionDetails(versionId) {
  if (mongoose.connection?.readyState === 1 && mongoose.isValidObjectId(versionId)) {
    try {
      const dbVersion = await VersionModel.findById(versionId).lean();
      if (dbVersion) {
        return {
          ...dbVersion,
          id: dbVersion._id.toString()
        };
      }
    } catch {
      // Fallback to memory
    }
  }

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

  // Update real document in DB if it exists
  if (mongoose.connection?.readyState === 1 && mongoose.isValidObjectId(documentId)) {
    try {
      // CRITICAL FIX: Include `content` in the update so the ProseMirror AST is actually restored,
      // not just the title and plainText. Without this, restoring a version had no visible effect.
      // [ROMAN URDU]: content field ko update mein shamil karna zaroori hai warna restore
      // se document ka rich-text AST change nahi hota tha.
      const updatePayload = {
        title: targetVersion.title,
        lastModifiedBy: restoredBy,
        $inc: { version: 1 }
      };
      // Restore the content field (AST or string)
      if (targetVersion.content !== undefined) {
        updatePayload.content = targetVersion.content;
      }
      // Derive plainText from content
      if (typeof targetVersion.content === 'string') {
        updatePayload.plainText = targetVersion.content;
      } else if (typeof targetVersion.content === 'object' && targetVersion.content !== null) {
        // Extract plain text from AST for search indexing
        updatePayload.plainText = extractPlainText(targetVersion.content);
      } else {
        updatePayload.plainText = '';
      }
      await DocumentModel.findByIdAndUpdate(documentId, updatePayload);
    } catch {
      // Non-fatal if DocumentModel update fails
    }
  }

  // Create a brand new version snapshot with the old content (non-destructive)
  const restoredVersion = await createVersionRecord({
    documentId,
    title: targetVersion.title,
    content: targetVersion.content,
    createdBy: restoredBy,
    changeSummary: `Restored from Version #${targetVersion.versionNumber}`
  });

  return restoredVersion;
}

/**
 * Deletes a version snapshot by its unique ID.
 */
export async function deleteVersionSnapshot(versionId) {
  if (mongoose.connection?.readyState === 1 && mongoose.isValidObjectId(versionId)) {
    try {
      const deletedFromDb = await VersionModel.findByIdAndDelete(versionId).lean();
      if (deletedFromDb) {
        // Also clean memory
        const memIdx = inMemoryVersionStore.findIndex(v => v.id === String(versionId));
        if (memIdx !== -1) inMemoryVersionStore.splice(memIdx, 1);
        return {
          ...deletedFromDb,
          id: deletedFromDb._id.toString()
        };
      }
    } catch {
      // Fallback
    }
  }

  const index = inMemoryVersionStore.findIndex(v => v.id === String(versionId));
  if (index === -1) {
    const error = new Error(`Version with ID '${versionId}' not found`);
    error.statusCode = 404;
    throw error;
  }
  const deleted = inMemoryVersionStore.splice(index, 1)[0];
  return deleted;
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

function extractPlainText(content) {
  if (!content) return '';
  let parsed = content;
  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        return content;
      }
    } else {
      return content;
    }
  }

  function walk(node) {
    if (!node) return '';
    if (node.type === 'text' && node.text) {
      return node.text;
    }
    if (Array.isArray(node.content)) {
      return node.content.map(walk).filter(Boolean).join(' ');
    }
    return '';
  }

  if (typeof parsed === 'object' && parsed !== null) {
    const text = walk(parsed);
    if (text) return text;
  }

  return typeof content === 'string' ? content : '';
}

/**
 * Performs a global search across all documents by keyword matching,
 * strictly filtered by user's accessible workspace permissions.
 */
export async function searchAllDocuments(query, accessibleWorkspaceIds = [], userId = '') {
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();

  // If MongoDB is connected, search DocumentModel directly with strict workspace isolation
  if (mongoose.connection?.readyState === 1) {
    try {
      const docFilter = {
        isArchived: false,
        deletedAt: null,
      };

      // Filter strictly by workspaces user has access to or documents created by user
      if (accessibleWorkspaceIds && accessibleWorkspaceIds.length > 0) {
        if (userId) {
          docFilter.$or = [
            { workspaceId: { $in: accessibleWorkspaceIds } },
            { createdBy: userId }
          ];
        } else {
          docFilter.workspaceId = { $in: accessibleWorkspaceIds };
        }
      } else if (userId) {
        docFilter.createdBy = userId;
      }

      const docs = await DocumentModel.find(docFilter)
        .select('_id title plainText tags updatedAt workspaceId')
        .lean();

      const matchedDocs = docs.filter(doc => {
        const titleMatch = (doc.title || '').toLowerCase().includes(searchTerm);
        const textMatch = (doc.plainText || '').toLowerCase().includes(searchTerm);
        const tagMatch = Array.isArray(doc.tags) && doc.tags.some(t => String(t).toLowerCase().includes(searchTerm));
        return titleMatch || textMatch || tagMatch;
      });

      const allResults = [];
      if (matchedDocs.length > 0) {
        allResults.push(...matchedDocs.map(doc => ({
          type: 'document',
          documentId: doc._id.toString(),
          matchedVersionId: `doc_${doc._id}`,
          versionNumber: 1,
          title: doc.title || 'Untitled Document',
          matchedContentSnippet: (doc.plainText || '').slice(0, 140) || doc.title,
          updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString()
        })));
      }

      try {
        const folderFilter = { name: { $regex: escapeRegex(searchTerm), $options: 'i' } };
        if (accessibleWorkspaceIds && accessibleWorkspaceIds.length > 0) {
          folderFilter.workspace = { $in: accessibleWorkspaceIds };
        }
        const folders = await Folder.find(folderFilter).select('_id name workspace updatedAt').lean();
        allResults.push(...folders.map(f => ({
          type: 'folder',
          id: f._id.toString(),
          documentId: f._id.toString(),
          title: f.name,
          matchedContentSnippet: 'Workspace Folder',
          updatedAt: f.updatedAt ? f.updatedAt.toISOString() : new Date().toISOString(),
          workspaceId: f.workspace?.toString()
        })));
      } catch (_) {}

      try {
        const fileFilter = {
          isDeleted: false,
          $or: [
            { fileName: { $regex: escapeRegex(searchTerm), $options: 'i' } },
            { originalName: { $regex: escapeRegex(searchTerm), $options: 'i' } }
          ]
        };
        if (accessibleWorkspaceIds && accessibleWorkspaceIds.length > 0) {
          fileFilter.workspaceId = { $in: accessibleWorkspaceIds };
        }
        const files = await FileModel.find(fileFilter).select('_id fileName originalName mimeType fileSize downloadUrl updatedAt workspaceId').lean();
        allResults.push(...files.map(fl => ({
          type: 'file',
          id: fl._id.toString(),
          documentId: fl._id.toString(),
          title: fl.fileName || fl.originalName,
          matchedContentSnippet: `${fl.mimeType} (${Math.round((fl.fileSize || 0) / 1024)} KB)`,
          updatedAt: fl.updatedAt ? fl.updatedAt.toISOString() : new Date().toISOString(),
          workspaceId: fl.workspaceId,
          downloadUrl: fl.downloadUrl
        })));
      } catch (_) {}

      if (allResults.length > 0) {
        return allResults;
      }
    } catch {
      // Fall through to in-memory store
    }
  }

  // Fallback: search through in-memory version snapshots matching title, content, or summary
  const matches = inMemoryVersionStore.filter(version => {
    const plainContent = extractPlainText(version.content);
    const titleMatch = (version.title || '').toLowerCase().includes(searchTerm);
    const contentMatch = plainContent.toLowerCase().includes(searchTerm) || (version.content || '').toLowerCase().includes(searchTerm);
    const summaryMatch = (version.changeSummary || '').toLowerCase().includes(searchTerm);
    return titleMatch || contentMatch || summaryMatch;
  });

  // Group by documentId and return the latest matching version for each document
  const resultMap = new Map();
  matches.forEach(item => {
    const plainText = extractPlainText(item.content);
    if (!resultMap.has(item.documentId) || resultMap.get(item.documentId).versionNumber < item.versionNumber) {
      resultMap.set(item.documentId, {
        documentId: item.documentId,
        matchedVersionId: item.id,
        versionNumber: item.versionNumber,
        title: item.title,
        matchedContentSnippet: plainText ? plainText.slice(0, 140) : (item.changeSummary || item.title),
        updatedAt: item.createdAt
      });
    }
  });

  return Array.from(resultMap.values());
}

