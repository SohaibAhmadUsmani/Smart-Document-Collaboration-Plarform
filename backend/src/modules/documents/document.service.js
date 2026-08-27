/**
 * @file document.service.js
 * @description Core business logic and database service layer for documents.
 * Handles document creation, OCC-backed autosave, metadata editing, tagging,
 * attachments, version checkpoints, trash retention, duplication, and exports.
 * @module backend/src/modules/documents/document.service
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh file DocSync Pro ke document module ka core service layer hai.
 * Isme database queries, atomic optimistic concurrency control (OCC autosave),
 * 25th-edit snapshot milestone events, 30-day trash lifecycle, tag normalization,
 * aur document export engine handle kiya gaya hai.
 */

import crypto from 'crypto';
import { DocumentModel } from './document.model.js';
import { documentEvents, DOCUMENT_EVENTS } from './document.events.js';
import {
  calculateDocumentStats,
  extractPlainTextFromAst,
  astToMarkdown,
  ensureBlockIdsInAst,
  sanitizeDocumentAst,
} from './document.utils.js';
import { getTemplateById } from './documentTemplates.js';

const TRASH_RETENTION_DAYS = 30;

/**
 * Normalizes, trims, and deduplicates an array of tag strings.
 *
 * [ROMAN URDU]:
 * Tags array ko lowercase, trim, deduplicate (Set ke zariye) aur max 30 characters
 * tak sanitize karta hai taake database queries clean aur consistent rahein.
 *
 * @param {string[]} [tags=[]] - Raw tags input
 * @returns {string[]} Clean deduplicated tags array
 */
function cleanTagsList(tags = []) {
  if (!Array.isArray(tags)) return [];
  return Array.from(
    new Set(tags.map((t) => String(t).trim().toLowerCase().slice(0, 30)).filter(Boolean))
  );
}

/**
 * Creates a new document in the database, applying starter templates if specified.
 *
 * [ROMAN URDU]:
 * Naya document create karta hai. Agar `templateId` diya gaya ho toh preset template ka
 * content aur structure load karta hai, block IDs inject karta hai, XSS sanitize karta hai,
 * aur `document.created` event emit karta hai.
 *
 * @param {Object} documentData - Data payload for the new document
 * @param {string} userId - ID of the authenticated user creating the document
 * @returns {Promise<Object>} Created document Mongoose document
 */
export async function createDocument(documentData, userId) {
  let template = null;
  if (documentData.templateId) {
    template = getTemplateById(documentData.templateId);
  }

  const rawContent = documentData.content || template?.content || {
    type: 'doc',
    content: [{ type: 'paragraph', attrs: { blockId: `block_${crypto.randomUUID()}` }, content: [] }],
  };

  const content = sanitizeDocumentAst(ensureBlockIdsInAst(rawContent));
  const plainText = documentData.plainText !== undefined
    ? documentData.plainText
    : extractPlainTextFromAst(content);

  const initialTags = Array.isArray(documentData.tags) && documentData.tags.length > 0
    ? documentData.tags
    : (template?.tags || []);

  const tags = cleanTagsList(initialTags);

  const newDocument = new DocumentModel({
    workspaceId: documentData.workspaceId,
    folderId: documentData.folderId || null,
    title: documentData.title || template?.title || 'Untitled Document',
    content,
    plainText,
    icon: documentData.icon || template?.icon || null,
    coverImage: documentData.coverImage || null,
    tags,
    favoritedBy: [],
    attachments: [],
    createdBy: userId,
    lastModifiedBy: userId,
    isArchived: false,
    version: 1,
    snapshotCheckpointVersion: 1,
    templateId: documentData.templateId || null,
  });

  const saved = await newDocument.save();

  documentEvents.emit(DOCUMENT_EVENTS.CREATED, {
    documentId: saved.id,
    workspaceId: saved.workspaceId,
    folderId: saved.folderId,
    title: saved.title,
    actorId: userId,
    createdBy: userId,
    userId,
    timestamp: saved.createdAt || new Date(),
  });

  return saved;
}

/**
 * Retrieves an active document by its MongoDB ObjectId.
 *
 * [ROMAN URDU]:
 * Document ID ke zariye record fetch karta hai. Default tor par archived/trash documents
 * exclude hote hain jab tak `includeArchived` option true na ho.
 *
 * @param {string} documentId - ObjectId of the document
 * @param {Object} [options={}] - Additional query options
 * @param {boolean} [options.includeArchived=false] - If true, returns even archived documents
 * @returns {Promise<Object|null>} Found document or null
 */
export async function getDocumentById(documentId, options = {}) {
  const query = { _id: documentId };

  if (!options.includeArchived) {
    query.isArchived = false;
  }

  return await DocumentModel.findOne(query).exec();
}

/**
 * Lists documents in a workspace with folder, tag, favorite, search, and sort filters.
 *
 * [ROMAN URDU]:
 * Workspace ke documents ko filter aur pagination ke sath list karta hai. Tag, folderId,
 * favoritedBy, aur title search filters support karta hai. Performance ke liye `.lean()`
 * aur indexed projection use karta hai.
 *
 * @param {string} workspaceId - Workspace ID
 * @param {Object} [filters={}] - Query filters (folderId, tag, favorited, search, sortBy, page, limit)
 * @param {string|null} [userId=null] - Optional current user ID for favorited filter
 * @returns {Promise<{ documents: Array, total: number, page: number, limit: number }>}
 */
export async function listDocuments(workspaceId, filters = {}, userId = null) {
  const {
    folderId,
    tag,
    favorited,
    search,
    sortBy = 'updatedAt_desc',
    isArchived = false,
    page = 1,
    limit = 50,
  } = filters;

  const query = {
    workspaceId,
    isArchived: Boolean(isArchived),
  };

  if (folderId !== undefined && folderId !== null) {
    query.folderId = folderId;
  }

  if (tag && typeof tag === 'string' && tag.trim()) {
    query.tags = tag.trim().toLowerCase();
  }

  if (favorited === 'true' && userId) {
    query.favoritedBy = userId;
  }

  if (search && typeof search === 'string' && search.trim()) {
    query.title = { $regex: search.trim(), $options: 'i' };
  }

  let sortOption = { updatedAt: -1 };
  if (sortBy === 'updatedAt_asc') sortOption = { updatedAt: 1 };
  if (sortBy === 'createdAt_desc') sortOption = { createdAt: -1 };
  if (sortBy === 'createdAt_asc') sortOption = { createdAt: 1 };
  if (sortBy === 'title_asc') sortOption = { title: 1 };
  if (sortBy === 'title_desc') sortOption = { title: -1 };

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (parsedPage - 1) * parsedLimit;

  const [documents, total] = await Promise.all([
    DocumentModel.find(query)
      .select('id workspaceId folderId title icon coverImage tags favoritedBy attachments createdBy lastModifiedBy updatedAt createdAt isArchived version')
      .sort(sortOption)
      .skip(skip)
      .limit(parsedLimit)
      .lean()
      .exec(),
    DocumentModel.countDocuments(query).exec(),
  ]);

  return { documents, total, page: parsedPage, limit: parsedLimit };
}

/**
 * Updates document metadata (title, icon, coverImage, folderId).
 *
 * [ROMAN URDU]:
 * Document ke metadata (title, icon, cover, folderId) ko update karta hai aur
 * `METADATA_UPDATED` domain event emit karta hai.
 *
 * @param {string} documentId - Document ID
 * @param {Object} updateData - Metadata fields to update
 * @param {string} userId - ID of the user performing the update
 * @returns {Promise<Object|null>} Updated document or null
 */
export async function updateDocumentMetadata(documentId, updateData, userId) {
  const allowedUpdates = {};

  if (updateData.title !== undefined) allowedUpdates.title = updateData.title;
  if (updateData.icon !== undefined) allowedUpdates.icon = updateData.icon;
  if (updateData.coverImage !== undefined) allowedUpdates.coverImage = updateData.coverImage;
  if (updateData.folderId !== undefined) allowedUpdates.folderId = updateData.folderId;

  allowedUpdates.lastModifiedBy = userId;

  const updated = await DocumentModel.findOneAndUpdate(
    { _id: documentId, isArchived: false },
    { $set: allowedUpdates },
    { new: true, runValidators: true }
  ).exec();

  if (updated) {
    documentEvents.emit(DOCUMENT_EVENTS.METADATA_UPDATED, {
      documentId: updated.id,
      workspaceId: updated.workspaceId,
      title: updated.title,
      updates: allowedUpdates,
      actorId: userId,
      userId,
      timestamp: updated.updatedAt || new Date(),
    });
  }

  return updated;
}

/**
 * Autosaves document content with atomic Optimistic Concurrency Control (OCC).
 * Increments version and emits milestone snapshots every 25 edits.
 *
 * [ROMAN URDU]:
 * Yeh function atomic OCC use karta hai. Database mein baseVersion check hota hai;
 * agar kisi aur ne document update kar diya ho toh conflict object return hota hai (409 status ke liye)
 * taake data overwrite na ho. Agar `contentPayload.force` true ho toh OCC check bypass hota hai
 * (Conflict Resolution Option 1: Keep My Local Version). Har 25 edits par snapshot milestone event trigger hota hai.
 *
 * @param {string} documentId - Document ObjectId
 * @param {Object} contentPayload - { content, plainText, baseVersion, force }
 * @param {string} userId - ID of the user editing the document
 * @returns {Promise<Object|null>} Updated document or conflict descriptor
 */
export async function autosaveDocumentContent(documentId, contentPayload, userId) {
  const content = sanitizeDocumentAst(ensureBlockIdsInAst(contentPayload.content));
  const plainText = contentPayload.plainText !== undefined
    ? contentPayload.plainText
    : extractPlainTextFromAst(content);

  const previousDoc = await DocumentModel.findOne({ _id: documentId, isArchived: false })
    .select('version snapshotCheckpointVersion title content plainText updatedAt workspaceId')
    .lean()
    .exec();

  if (!previousDoc) return null;

  // Optimistic Concurrency Control (OCC) Check
  // [ROMAN URDU]: Agar force flag true ho toh OCC version mismatch check bypass ho jata hai (Option 1: Keep My Local Version)
  if (contentPayload.baseVersion !== undefined && contentPayload.baseVersion !== null && !contentPayload.force) {
    if (previousDoc.version !== Number(contentPayload.baseVersion)) {
      return {
        conflict: true,
        currentVersion: previousDoc.version,
        baseVersion: Number(contentPayload.baseVersion),
        serverDocument: previousDoc,
      };
    }
  }

  const updated = await DocumentModel.findOneAndUpdate(
    { _id: documentId, isArchived: false },
    {
      $set: { content, plainText, lastModifiedBy: userId },
      $inc: { version: 1 },
    },
    { new: true, runValidators: true }
  ).exec();

  if (updated) {
    documentEvents.emit(DOCUMENT_EVENTS.CONTENT_SAVED, {
      documentId: updated.id,
      workspaceId: updated.workspaceId,
      title: updated.title,
      version: updated.version,
      previousVersion: previousDoc.version,
      content: updated.content,
      plainText: updated.plainText,
      actorId: userId,
      modifiedBy: userId,
      userId,
      timestamp: updated.updatedAt || new Date(),
    });

    // Milestone Snapshot Checkpoint (Emit every 25 edits)
    if (updated.version % 25 === 0) {
      documentEvents.emit(DOCUMENT_EVENTS.SNAPSHOT_CHECKPOINT_CREATED, {
        documentId: updated.id,
        workspaceId: updated.workspaceId,
        version: updated.version,
        title: updated.title,
        content: updated.content,
        plainText: updated.plainText,
        actorId: userId,
        createdBy: userId,
        userId,
        timestamp: updated.updatedAt || new Date(),
      });
    }
  }

  return updated;
}

/**
 * Toggles a user's favorite / starred status on a document.
 *
 * [ROMAN URDU]:
 * Document par user ka star/favorite toggle karta hai (`$pull` ya `$addToSet`).
 * Updated count aur boolean status return karta hai.
 *
 * @param {string} documentId - Document ObjectId
 * @param {string} userId - User ID toggling star
 * @returns {Promise<{ documentId: string, isFavorited: boolean, favoriteCount: number }|null>}
 */
export async function toggleFavoriteDocument(documentId, userId) {
  const doc = await DocumentModel.findOne({ _id: documentId, isArchived: false });
  if (!doc) return null;

  const isFavorited = doc.favoritedBy.includes(userId);
  const updateQuery = isFavorited
    ? { $pull: { favoritedBy: userId } }
    : { $addToSet: { favoritedBy: userId } };

  const updated = await DocumentModel.findByIdAndUpdate(documentId, updateQuery, {
    new: true,
  }).exec();

  documentEvents.emit(DOCUMENT_EVENTS.FAVORITE_TOGGLED, {
    documentId: doc.id,
    workspaceId: doc.workspaceId,
    title: doc.title,
    actorId: userId,
    userId,
    isFavorited: !isFavorited,
    timestamp: new Date(),
  });

  return {
    documentId,
    isFavorited: !isFavorited,
    favoriteCount: updated.favoritedBy.length,
  };
}

/**
 * Updates document tags with automatic sanitization and normalization.
 *
 * [ROMAN URDU]:
 * Document ke tags ko normalize aur deduplicate karke update karta hai.
 *
 * @param {string} documentId - Document ObjectId
 * @param {string[]} tags - Array of new tags
 * @param {string} userId - ID of the user updating tags
 * @returns {Promise<Object|null>} Updated document
 */
export async function updateDocumentTags(documentId, tags, userId) {
  const cleanTags = cleanTagsList(tags);

  const updated = await DocumentModel.findOneAndUpdate(
    { _id: documentId, isArchived: false },
    { $set: { tags: cleanTags, lastModifiedBy: userId } },
    { new: true, runValidators: true }
  ).exec();

  if (updated) {
    documentEvents.emit(DOCUMENT_EVENTS.TAGS_UPDATED, {
      documentId: updated.id,
      workspaceId: updated.workspaceId,
      title: updated.title,
      tags: cleanTags,
      actorId: userId,
      userId,
      timestamp: updated.updatedAt || new Date(),
    });
  }

  return updated;
}

/**
 * Aggregates all unique tags across a workspace with their respective document counts.
 *
 * [ROMAN URDU]:
 * MongoDB aggregation pipeline chala kar workspace ke tamam unique tags aur unki
 * usage frequency count karta hai.
 *
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Array<{ tag: string, count: number }>>}
 */
export async function getWorkspaceTags(workspaceId) {
  return await DocumentModel.aggregate([
    { $match: { workspaceId, isArchived: false } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $project: { tag: '$_id', count: 1, _id: 0 } },
  ]);
}

/**
 * Links a file attachment record to a document or a specific block node anchor.
 *
 * [ROMAN URDU]:
 * Document mein file attachment record add karta hai aur `ATTACHMENT_LINKED` event emit karta hai.
 *
 * @param {string} documentId - Document ObjectId
 * @param {Object} attachmentPayload - Attachment details
 * @param {string} userId - Uploader user ID
 * @returns {Promise<{ updated: Object, attachment: Object }|null>}
 */
export async function addDocumentAttachment(documentId, attachmentPayload, userId) {
  const attachment = {
    attachmentId: crypto.randomUUID(),
    fileId: String(attachmentPayload.fileId),
    fileName: String(attachmentPayload.fileName || 'attachment'),
    fileSize: Number(attachmentPayload.fileSize || 0),
    mimeType: String(attachmentPayload.mimeType || 'application/octet-stream'),
    storageKey: String(attachmentPayload.storageKey || ''),
    downloadUrl: String(attachmentPayload.downloadUrl || ''),
    nodeAnchorId: attachmentPayload.nodeAnchorId ? String(attachmentPayload.nodeAnchorId) : null,
    uploadedBy: userId,
    uploadedAt: new Date(),
  };

  const updated = await DocumentModel.findOneAndUpdate(
    { _id: documentId, isArchived: false },
    {
      $push: { attachments: attachment },
      $set: { lastModifiedBy: userId },
    },
    { new: true }
  ).exec();

  if (!updated) return null;

  documentEvents.emit(DOCUMENT_EVENTS.ATTACHMENT_LINKED, {
    documentId: updated.id,
    workspaceId: updated.workspaceId,
    title: updated.title,
    attachment,
    actorId: userId,
    userId,
    timestamp: new Date(),
  });

  return { updated, attachment };
}

/**
 * Unlinks an attachment from a document.
 *
 * [ROMAN URDU]:
 * Document ke attachments array se specified attachment ko remove karta hai.
 *
 * @param {string} documentId - Document ObjectId
 * @param {string} attachmentId - Attachment UUID to remove
 * @param {string} userId - User ID removing attachment
 * @returns {Promise<Object|null>} Updated document
 */
export async function removeDocumentAttachment(documentId, attachmentId, userId) {
  const updated = await DocumentModel.findOneAndUpdate(
    { _id: documentId },
    {
      $pull: { attachments: { attachmentId } },
      $set: { lastModifiedBy: userId },
    },
    { new: true }
  ).exec();

  if (updated) {
    documentEvents.emit(DOCUMENT_EVENTS.ATTACHMENT_UNLINKED, {
      documentId: updated.id,
      workspaceId: updated.workspaceId,
      title: updated.title,
      attachmentId,
      actorId: userId,
      userId,
      timestamp: new Date(),
    });
  }

  return updated;
}

/**
 * Duplicates an existing document with a new title prefix and clean version counter.
 *
 * [ROMAN URDU]:
 * Mojooda document ka clone banata hai ("Copy of [Title]"), fresh block IDs inject karta hai,
 * version 1 se restart karta hai, aur `DUPLICATED` event emit karta hai.
 *
 * @param {string} documentId - Original document ID to duplicate
 * @param {string} userId - User ID creating the duplicate
 * @returns {Promise<Object|null>} Newly created cloned document
 */
export async function duplicateDocument(documentId, userId) {
  const original = await DocumentModel.findOne({ _id: documentId, isArchived: false }).lean().exec();
  if (!original) return null;

  const cloned = new DocumentModel({
    workspaceId: original.workspaceId,
    folderId: original.folderId,
    title: `Copy of ${original.title}`,
    content: ensureBlockIdsInAst(original.content),
    plainText: original.plainText,
    icon: original.icon,
    coverImage: original.coverImage,
    tags: original.tags || [],
    favoritedBy: [],
    attachments: original.attachments || [],
    createdBy: userId,
    lastModifiedBy: userId,
    isArchived: false,
    version: 1,
    snapshotCheckpointVersion: 1,
  });

  const saved = await cloned.save();

  documentEvents.emit(DOCUMENT_EVENTS.DUPLICATED, {
    originalDocumentId: documentId,
    newDocumentId: saved.id,
    documentId: saved.id,
    workspaceId: saved.workspaceId,
    title: saved.title,
    actorId: userId,
    userId,
    timestamp: saved.createdAt || new Date(),
  });

  return saved;
}

/**
 * Exports document content in the requested format (markdown, json, text).
 *
 * [ROMAN URDU]:
 * Document ko requested format (Markdown, JSON, Plain Text) mein convert karke
 * download payload (filename, mimeType, content) return karta hai.
 *
 * @param {string} documentId - Document ObjectId
 * @param {string} [format='markdown'] - Desired format ('markdown' | 'json' | 'text')
 * @returns {Promise<{ filename: string, mimeType: string, content: string }|null>} Export descriptor
 */
export async function exportDocument(documentId, format = 'markdown') {
  const document = await DocumentModel.findOne({ _id: documentId, isArchived: false }).lean().exec();
  if (!document) return null;

  const safeTitle = (document.title || 'untitled').replace(/[^a-zA-Z0-9_-]/g, '_');

  if (format === 'json') {
    return {
      filename: `${safeTitle}.json`,
      mimeType: 'application/json',
      content: JSON.stringify(document, null, 2),
    };
  }

  if (format === 'text') {
    return {
      filename: `${safeTitle}.txt`,
      mimeType: 'text/plain',
      content: document.plainText || '',
    };
  }

  const markdown = astToMarkdown(document.content, document.title);
  return {
    filename: `${safeTitle}.md`,
    mimeType: 'text/markdown',
    content: markdown,
  };
}

/**
 * Computes word, character, and reading time statistics for a document.
 *
 * [ROMAN URDU]:
 * Document ke plain text se live stats calculate karta hai.
 *
 * @param {string} documentId - Document ObjectId
 * @returns {Promise<Object|null>} Statistics payload
 */
export async function getDocumentStats(documentId) {
  const document = await DocumentModel.findOne({ _id: documentId, isArchived: false })
    .select('plainText title version updatedAt')
    .lean()
    .exec();

  if (!document) return null;

  const stats = calculateDocumentStats(document.plainText || '');
  return {
    documentId,
    title: document.title,
    version: document.version,
    updatedAt: document.updatedAt,
    ...stats,
  };
}

/**
 * Moves a document to the trash bin with a 30-day auto-purge retention schedule.
 *
 * [ROMAN URDU]:
 * Document ko soft-delete (trash) mein bhejta hai. `scheduledPermanentDeletionAt` mein
 * 30 days aage ki date set hoti hai jo MongoDB TTL index se automatically purge ho sakti hai.
 *
 * @param {string} documentId - Document ObjectId
 * @param {string} userId - User ID deleting the document
 * @returns {Promise<Object|null>} Archived document
 */
export async function moveToTrash(documentId, userId) {
  const scheduledPurgeDate = new Date();
  scheduledPurgeDate.setDate(scheduledPurgeDate.getDate() + TRASH_RETENTION_DAYS);

  const doc = await DocumentModel.findOne({ _id: documentId, isArchived: false });
  if (!doc) return null;

  doc.isArchived = true;
  doc.deletedAt = new Date();
  doc.deletedBy = userId;
  doc.scheduledPermanentDeletionAt = scheduledPurgeDate;
  doc.previousFolderId = doc.folderId;
  doc.folderId = null;
  doc.lastModifiedBy = userId;

  const saved = await doc.save();

  documentEvents.emit(DOCUMENT_EVENTS.ARCHIVED, {
    documentId: saved.id,
    workspaceId: saved.workspaceId,
    title: saved.title,
    actorId: userId,
    userId,
    timestamp: saved.deletedAt || new Date(),
  });

  return saved;
}

/**
 * Restores an archived document from the trash bin back to its original or target folder.
 *
 * [ROMAN URDU]:
 * Trash se document ko restore karta hai, deletion dates clear karta hai, aur
 * document ko uske original folder ya specified folder mein wapas bhejta hai.
 *
 * @param {string} documentId - Document ObjectId
 * @param {string} userId - User ID restoring the document
 * @param {string|null} [targetFolderId=null] - Optional new folder destination
 * @returns {Promise<Object|null>} Restored document
 */
export async function restoreFromTrash(documentId, userId, targetFolderId = null) {
  const doc = await DocumentModel.findOne({ _id: documentId, isArchived: true });
  if (!doc) return null;

  doc.isArchived = false;
  doc.deletedAt = null;
  doc.deletedBy = null;
  doc.scheduledPermanentDeletionAt = null;
  doc.folderId = targetFolderId !== undefined && targetFolderId !== null ? targetFolderId : doc.previousFolderId;
  doc.previousFolderId = null;
  doc.lastModifiedBy = userId;

  const restored = await doc.save();

  documentEvents.emit(DOCUMENT_EVENTS.RESTORED, {
    documentId: restored.id,
    workspaceId: restored.workspaceId,
    folderId: restored.folderId,
    title: restored.title,
    actorId: userId,
    userId,
    timestamp: new Date(),
  });

  return restored;
}

/**
 * Lists archived documents currently in the trash for a workspace.
 *
 * [ROMAN URDU]:
 * Workspace ke trash mein mojood documents list karta hai pagination ke sath.
 *
 * @param {string} workspaceId - Workspace ID
 * @param {Object} [pagination={}] - { page, limit }
 * @returns {Promise<{ documents: Array, total: number, page: number, limit: number }>}
 */
export async function listTrashDocuments(workspaceId, pagination = {}) {
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 50));
  const query = { workspaceId, isArchived: true };
  const skip = (page - 1) * limit;

  const [documents, total] = await Promise.all([
    DocumentModel.find(query)
      .select('id title icon tags deletedAt deletedBy scheduledPermanentDeletionAt previousFolderId updatedAt createdAt')
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    DocumentModel.countDocuments(query).exec(),
  ]);

  return { documents, total, page, limit };
}

/**
 * Permanently deletes a single document from the database.
 *
 * [ROMAN URDU]:
 * Trash mein mojood document ko database se mukammal aur permanently delete karta hai.
 *
 * @param {string} documentId - Document ObjectId
 * @param {string} userId - User ID authorizing permanent purge
 * @returns {Promise<Object|null>} Deleted document record
 */
export async function permanentlyDeleteDocument(documentId, userId) {
  const doc = await DocumentModel.findOneAndDelete({ _id: documentId, isArchived: true });

  if (doc) {
    documentEvents.emit(DOCUMENT_EVENTS.PERMANENTLY_DELETED, {
      documentId: doc.id || documentId,
      workspaceId: doc.workspaceId,
      title: doc.title || 'Untitled Document',
      actorId: userId,
      userId,
      timestamp: new Date(),
    });
  }

  return doc;
}

/**
 * Empties all trash documents for a workspace.
 *
 * [ROMAN URDU]:
 * Kisi workspace ke tamam archived/trash documents ko aik sath permanently delete karta hai.
 *
 * @param {string} workspaceId - Workspace ID
 * @param {string} userId - User ID performing the action
 * @returns {Promise<{ deletedCount: number }>}
 */
export async function emptyWorkspaceTrash(workspaceId, userId) {
  const result = await DocumentModel.deleteMany({ workspaceId, isArchived: true });
  return { deletedCount: result.deletedCount };
}
