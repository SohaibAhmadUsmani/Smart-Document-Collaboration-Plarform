import { DocumentModel } from './document.model.js';
import { calculateDocumentStats, astToMarkdown } from './document.utils.js';

/**
 * Creates a new document in the database.
 *
 * @param {Object} documentData - Data for the new document.
 * @param {string} userId - ID of the authenticated user creating the document.
 * @returns {Promise<Object>} Created document.
 */
export async function createDocument(documentData, userId) {
  const newDocument = new DocumentModel({
    workspaceId: documentData.workspaceId,
    folderId: documentData.folderId || null,
    title: documentData.title || 'Untitled Document',
    content: documentData.content || {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    },
    plainText: documentData.plainText || '',
    icon: documentData.icon || null,
    coverImage: documentData.coverImage || null,
    createdBy: userId,
    lastModifiedBy: userId,
    isArchived: false,
    version: 1,
  });

  return await newDocument.save();
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
 * Lists documents in a workspace, with optional folder, search, and sort filters.
 *
 * @param {string} workspaceId - Workspace ID.
 * @param {Object} filters - Optional folder, search, sorting, and pagination filters.
 * @returns {Promise<{ documents: Array, total: number, page: number, limit: number }>}
 */
export async function listDocuments(workspaceId, filters = {}) {
  const {
    folderId,
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

  if (search && typeof search === 'string' && search.trim()) {
    query.title = { $regex: search.trim(), $options: 'i' };
  }

  // Determine sort order
  let sortOption = { updatedAt: -1 };
  if (sortBy === 'updatedAt_asc') sortOption = { updatedAt: 1 };
  if (sortBy === 'createdAt_desc') sortOption = { createdAt: -1 };
  if (sortBy === 'createdAt_asc') sortOption = { createdAt: 1 };
  if (sortBy === 'title_asc') sortOption = { title: 1 };
  if (sortBy === 'title_desc') sortOption = { title: -1 };

  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);

  const [documents, total] = await Promise.all([
    DocumentModel.find(query)
      .select('id workspaceId folderId title icon coverImage createdBy lastModifiedBy updatedAt createdAt isArchived version')
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

  return await DocumentModel.findOneAndUpdate(
    { _id: documentId, isArchived: false },
    { $set: allowedUpdates },
    { new: true, runValidators: true }
  ).exec();
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
  const { content, plainText } = contentPayload;

  const updateFields = {
    content,
    lastModifiedBy: userId,
  };

  if (plainText !== undefined) {
    updateFields.plainText = plainText;
  }

  return await DocumentModel.findOneAndUpdate(
    { _id: documentId, isArchived: false },
    {
      $set: updateFields,
      $inc: { version: 1 },
    },
    { new: true, runValidators: true }
  ).exec();
}

/**
 * Duplicates an existing document.
 *
 * @param {string} documentId - ID of document to clone.
 * @param {string} userId - User ID performing clone.
 * @returns {Promise<Object>} Cloned document.
 */
export async function duplicateDocument(documentId, userId) {
  const original = await DocumentModel.findOne({ _id: documentId, isArchived: false }).lean().exec();
  if (!original) return null;

  const cloned = new DocumentModel({
    workspaceId: original.workspaceId,
    folderId: original.folderId,
    title: `Copy of ${original.title}`,
    content: original.content,
    plainText: original.plainText,
    icon: original.icon,
    coverImage: original.coverImage,
    createdBy: userId,
    lastModifiedBy: userId,
    isArchived: false,
    version: 1,
  });

  return await cloned.save();
}

/**
 * Exports document content in requested format (markdown, json, text).
 *
 * @param {string} documentId - Document ID.
 * @param {string} [format='markdown'] - Desired format: 'markdown' | 'json' | 'text'.
 * @returns {Promise<{ filename: string, mimeType: string, content: string }>}
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

  // Default: markdown
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
 * @param {string} documentId - Document ID.
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
 * Soft deletes (archives) a document.
 *
 * @param {string} documentId - Document ID.
 * @param {string} userId - ID of user archiving the document.
 * @returns {Promise<Object|null>}
 */
export async function archiveDocument(documentId, userId) {
  return await DocumentModel.findOneAndUpdate(
    { _id: documentId, isArchived: false },
    {
      $set: {
        isArchived: true,
        lastModifiedBy: userId,
      },
    },
    { new: true }
  ).exec();
}

/**
 * Restores an archived document back to active state.
 *
 * @param {string} documentId - Document ID.
 * @param {string} userId - ID of user restoring the document.
 * @returns {Promise<Object|null>}
 */
export async function restoreDocument(documentId, userId) {
  return await DocumentModel.findOneAndUpdate(
    { _id: documentId, isArchived: true },
    {
      $set: {
        isArchived: false,
        lastModifiedBy: userId,
      },
    },
    { new: true }
  ).exec();
}
