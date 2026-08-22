import { DocumentModel } from './document.model.js';

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
 * Lists documents in a workspace, with optional folder filter and pagination.
 *
 * @param {string} workspaceId - Workspace ID.
 * @param {Object} filters - Optional folder and pagination filters.
 * @returns {Promise<{ documents: Array, total: number }>}
 */
export async function listDocuments(workspaceId, filters = {}) {
  const { folderId, isArchived = false, page = 1, limit = 50 } = filters;

  const query = {
    workspaceId,
    isArchived: Boolean(isArchived),
  };

  if (folderId !== undefined) {
    query.folderId = folderId;
  }

  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);

  const [documents, total] = await Promise.all([
    DocumentModel.find(query)
      .select('id workspaceId folderId title icon coverImage createdBy lastModifiedBy updatedAt createdAt isArchived version')
      .sort({ updatedAt: -1 })
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
