/**
 * @file documentBatch.service.js
 * @description Batch processing service for bulk multi-document lifecycle operations.
 * Executes batch archive, restore, move, tag, duplicate, and permanent deletion with failure reporting.
 * @module backend/src/modules/documents/documentBatch.service
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh service ek sath multiple documents par batch operations chalane ke liye hai.
 * Agar user 10 documents select karke move, tag ya delete kare toh yeh loop chala kar
 * successful aur failed IDs ka audit breakdown return karti hai.
 */

import { DocumentModel } from './document.model.js';
import * as documentService from './document.service.js';

/**
 * Executes atomic batch operations across an array of document IDs.
 *
 * [ROMAN URDU]:
 * Batch action ('archive', 'restore', 'move', 'tag', 'duplicate', 'delete_permanent')
 * ko har document ID par execute karta hai aur results ko `{ succeeded: [], failed: [] }`
 * mein aggregate karke return karta hai.
 *
 * @param {'archive' | 'restore' | 'move' | 'tag' | 'duplicate' | 'delete_permanent'} action - Batch operation type
 * @param {string[]} documentIds - Array of document IDs to process
 * @param {Object} [payload={}] - Action-specific payload (targetFolderId, tagsToAdd, tagsToRemove)
 * @param {string} userId - ID of authenticated user executing batch
 * @returns {Promise<{ succeeded: string[], failed: Array<{ id: string, reason: string }> }>}
 */
export async function executeBatchOperation(action, documentIds, payload = {}, userId) {
  const succeeded = [];
  const failed = [];

  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    return { succeeded, failed };
  }

  for (const id of documentIds) {
    try {
      switch (action) {
        case 'archive': {
          const res = await documentService.moveToTrash(id, userId);
          if (res) succeeded.push(id);
          else failed.push({ id, reason: 'Document not found or already in trash' });
          break;
        }

        case 'restore': {
          const res = await documentService.restoreFromTrash(id, userId, payload.targetFolderId);
          if (res) succeeded.push(id);
          else failed.push({ id, reason: 'Document not found in trash' });
          break;
        }

        case 'move': {
          const res = await DocumentModel.findOneAndUpdate(
            { _id: id, isArchived: false },
            { $set: { folderId: payload.targetFolderId || null, lastModifiedBy: userId } },
            { new: true }
          );
          if (res) succeeded.push(id);
          else failed.push({ id, reason: 'Document not found or is archived' });
          break;
        }

        case 'tag': {
          const doc = await DocumentModel.findOne({ _id: id, isArchived: false });
          if (!doc) {
            failed.push({ id, reason: 'Document not found' });
            break;
          }
          let updatedTags = [...(doc.tags || [])];
          if (Array.isArray(payload.tagsToAdd)) {
            updatedTags.push(...payload.tagsToAdd);
          }
          if (Array.isArray(payload.tagsToRemove)) {
            updatedTags = updatedTags.filter((t) => !payload.tagsToRemove.includes(t));
          }
          await documentService.updateDocumentTags(id, updatedTags, userId);
          succeeded.push(id);
          break;
        }

        case 'duplicate': {
          const res = await documentService.duplicateDocument(id, userId);
          if (res) succeeded.push(res.id);
          else failed.push({ id, reason: 'Failed to duplicate document' });
          break;
        }

        case 'delete_permanent': {
          const res = await documentService.permanentlyDeleteDocument(id, userId);
          if (res) succeeded.push(id);
          else failed.push({ id, reason: 'Document not found in trash' });
          break;
        }

        default:
          failed.push({ id, reason: `Unsupported batch action '${action}'` });
      }
    } catch (err) {
      failed.push({ id, reason: err.message || 'Operation failed' });
    }
  }

  return { succeeded, failed };
}
