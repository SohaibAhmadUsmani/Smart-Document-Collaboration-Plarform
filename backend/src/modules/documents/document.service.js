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
 * Creates a new document in the database.
 *
 * @param {Object} documentData - Data for the new document.
 * @param {string} userId - ID of the authenticated user creating the document.
 * @returns {Promise<Object>} Created document.
 */
export async function createDocument(documentData, userId) {
  let template = null;
  if (documentData.templateId) {
    template = getTemplateById(documentData.templateId);
  }

  const rawContent = documentData.content || (template ? template.content : null) || {
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

  const cleanTags = Array.from(new Set(initialTags.map((t) => String(t).trim().toLowerCase().slice(0, 30)).filter(Boolean)));

  const newDocument = new DocumentModel({
    workspaceId: documentData.workspaceId,
    folderId: documentData.folderId || null,
    title: documentData.title || (template ? template.title : 'Untitled Document'),
    content,
    plainText,
    icon: documentData.icon || (template ? template.icon : null),
    coverImage: documentData.coverImage || null,
    tags: cleanTags,
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
    createdBy: userId,
    timestamp: saved.createdAt,
  });

  return saved;
}


/**
 * Retrieves a document by its ID.
 *
 * @param {string} documentId - ID of the document.
 * @param {Object} [options] - Additional query options.
 * @returns {Promise<Object|null>} Found document or null.
 */
export async function getDocumentById(documentId, options = {}) {
  const query = { _id: documentId };

  if (!options.includeArchived) {
    query.isArchived = false;
  }

  return await DocumentModel.findOne(query).exec();
}

/**
 * Lists documents in a workspace, with optional folder, tag, favorite, search, and sort filters.
 *
 * @param {string} workspaceId - Workspace ID.
 * @param {Object} filters - Query parameters
 * @param {string} [userId] - Optional current user ID for favorited filter
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

  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);

  const [documents, total] = await Promise.all([
    DocumentModel.find(query)
      .select('id workspaceId folderId title icon coverImage tags favoritedBy attachments createdBy lastModifiedBy updatedAt createdAt isArchived version')
      .sort(sortOption)
      .skip(skip)
      .limit(Math.min(100, limit))
      .lean()
      .exec(),
    DocumentModel.countDocuments(query).exec(),
  ]);

  return { documents, total, page: Number(page), limit: Number(limit) };
}

/**
 * Updates document metadata (title, icon, coverImage, folderId).
 *
 * @param {string} documentId - Document ID.
 * @param {Object} updateData - Metadata fields to update.
 * @param {string} userId - ID of the user performing the update.
 * @returns {Promise<Object|null>} Updated document.
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
      updates: allowedUpdates,
      actorId: userId,
      timestamp: updated.updatedAt,
    });
  }

  return updated;
}

/**
 * Autosaves the document rich-text JSON content and plain text.
 * Increments the document version for sync tracking.
 *
 * @param {string} documentId - Document ID.
 * @param {Object} contentPayload - Content AST object and optional plainText string.
 * @param {string} userId - ID of the user editing the document.
 * @returns {Promise<Object|null>} Updated document.
 */
export async function autosaveDocumentContent(documentId, contentPayload, userId) {
  const content = sanitizeDocumentAst(ensureBlockIdsInAst(contentPayload.content));
  const plainText = contentPayload.plainText !== undefined
    ? contentPayload.plainText
    : extractPlainTextFromAst(content);

  const previousDoc = await DocumentModel.findOne({ _id: documentId, isArchived: false })
    .select('version snapshotCheckpointVersion title content plainText updatedAt')
    .lean()
    .exec();

  if (!previousDoc) return null;

  // Optimistic Concurrency Control (OCC)
  if (contentPayload.baseVersion !== undefined && contentPayload.baseVersion !== null) {
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
      version: updated.version,
      previousVersion: previousDoc.version,
      content: updated.content,
      plainText: updated.plainText,
      modifiedBy: userId,
      timestamp: updated.updatedAt,
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
        createdBy: userId,
        timestamp: updated.updatedAt,
      });
    }
  }

  return updated;
}


/**
 * Toggles a user's favorite star status on a document.
 *
 * @param {string} documentId
 * @param {string} userId
 * @returns {Promise<{ isFavorited: boolean, favoriteCount: number }|null>}
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
    documentId,
    userId,
    isFavorited: !isFavorited,
  });

  return {
    documentId,
    isFavorited: !isFavorited,
    favoriteCount: updated.favoritedBy.length,
  };
}

/**
 * Updates document tags with normalization.
 *
 * @param {string} documentId
 * @param {string[]} tags
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export async function updateDocumentTags(documentId, tags, userId) {
  const cleanTags = Array.isArray(tags)
    ? Array.from(new Set(tags.map((t) => String(t).trim().toLowerCase().slice(0, 30)).filter(Boolean)))
    : [];

  const updated = await DocumentModel.findOneAndUpdate(
    { _id: documentId, isArchived: false },
    { $set: { tags: cleanTags, lastModifiedBy: userId } },
    { new: true, runValidators: true }
  ).exec();

  if (updated) {
    documentEvents.emit(DOCUMENT_EVENTS.TAGS_UPDATED, {
      documentId,
      tags: cleanTags,
      actorId: userId,
    });
  }

  return updated;
}

/**
 * Aggregates all unique tags across a workspace with their usage count.
 *
 * @param {string} workspaceId
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
 * Links a file attachment record to a document or specific node block.
 *
 * @param {string} documentId
 * @param {Object} attachmentPayload
 * @param {string} userId
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
    documentId,
    attachment,
    actorId: userId,
  });

  return { updated, attachment };
}

/**
 * Unlinks an attachment from a document.
 *
 * @param {string} documentId
 * @param {string} attachmentId
 * @param {string} userId
 * @returns {Promise<Object|null>}
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
      documentId,
      attachmentId,
      actorId: userId,
    });
  }

  return updated;
}

/**
 * Duplicates an existing document.
 *
 * @param {string} documentId
 * @param {string} userId
 * @returns {Promise<Object|null>}
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
    workspaceId: saved.workspaceId,
    actorId: userId,
  });

  return saved;
}

/**
 * Exports document content in requested format (markdown, json, text).
 *
 * @param {string} documentId
 * @param {string} [format='markdown']
 * @returns {Promise<{ filename: string, mimeType: string, content: string }|null>}
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
 * Computes word/character statistics for a document.
 *
 * @param {string} documentId
 * @returns {Promise<Object|null>}
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
 * Moves document to trash with 30-day auto-purge retention schedule.
 *
 * @param {string} documentId
 * @param {string} userId
 * @returns {Promise<Object|null>}
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
    actorId: userId,
    timestamp: saved.deletedAt,
  });

  return saved;
}

/**
 * Restores document from trash with smart folder validation.
 *
 * @param {string} documentId
 * @param {string} userId
 * @param {string|null} [targetFolderId=null]
 * @returns {Promise<Object|null>}
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
    actorId: userId,
    timestamp: new Date(),
  });

  return restored;
}

/**
 * Lists archived documents currently in trash for a workspace.
 *
 * @param {string} workspaceId
 * @param {Object} [pagination]
 * @returns {Promise<{ documents: Array, total: number }>}
 */
export async function listTrashDocuments(workspaceId, pagination = {}) {
  const { page = 1, limit = 50 } = pagination;
  const query = { workspaceId, isArchived: true };
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);

  const [documents, total] = await Promise.all([
    DocumentModel.find(query)
      .select('id title icon tags deletedAt deletedBy scheduledPermanentDeletionAt previousFolderId updatedAt createdAt')
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(Math.min(100, limit))
      .lean()
      .exec(),
    DocumentModel.countDocuments(query).exec(),
  ]);

  return { documents, total, page: Number(page), limit: Number(limit) };
}

/**
 * Permanently deletes a single document from database.
 *
 * @param {string} documentId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export async function permanentlyDeleteDocument(documentId, userId) {
  const doc = await DocumentModel.findOneAndDelete({ _id: documentId, isArchived: true });

  if (doc) {
    documentEvents.emit(DOCUMENT_EVENTS.PERMANENTLY_DELETED, {
      documentId,
      workspaceId: doc.workspaceId,
      actorId: userId,
    });
  }

  return doc;
}

/**
 * Empties all trash documents for a workspace.
 *
 * @param {string} workspaceId
 * @param {string} userId
 * @returns {Promise<{ deletedCount: number }>}
 */
export async function emptyWorkspaceTrash(workspaceId, userId) {
  const result = await DocumentModel.deleteMany({ workspaceId, isArchived: true });

  return { deletedCount: result.deletedCount };
}
