/**
 * @file document.controller.js
 * @description Express HTTP request controllers for document operations in DocSync Pro.
 * Handles document creation, retrieval, listing, autosave, tagging, exports,
 * batch operations, AST search, and trash management.
 * @module backend/src/modules/documents/document.controller
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh file DocSync Pro ke document module ke Express HTTP controllers par mushtamil hai.
 * Request parameters ko parse karna, user ID extract karna, service functions call karna,
 * aur RESTful JSON responses (200, 201, 400, 404, 409 Conflict) return karna iski zimadari hai.
 */

import * as documentService from './document.service.js';
import * as batchService from './documentBatch.service.js';
import * as astSearchService from './documentAstSearch.service.js';

/**
 * Extracts authenticated user ID from Express request.
 *
 * [ROMAN URDU]:
 * Request object se authenticated user ki ID extract karta hai, warna fallback 'anonymous-user' deta hai.
 *
 * @param {Object} req - Express request
 * @returns {string} User identifier
 */
function getUserId(req) {
  return req.user?.id || req.user?._id || 'anonymous-user';
}

/**
 * Handles creation of a new document.
 *
 * [ROMAN URDU]:
 * Naya document create karne ka HTTP handler. Status 201 ke sath newly created document data return karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function createDocumentHandler(req, res, next) {
  try {
    const userId = getUserId(req);
    const document = await documentService.createDocument(req.body, userId);

    return res.status(201).json({
      success: true,
      message: 'Document created successfully',
      data: document,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles fetching a single document by its ID.
 *
 * [ROMAN URDU]:
 * Document ID ke mutabiq single document return karta hai. Agar document na mile toh 404 error response deta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function getDocumentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles listing documents in a workspace with filters, search, and pagination.
 *
 * [ROMAN URDU]:
 * Workspace ke documents list karta hai. Query parameters (tags, folder, favorites, search query, sorting)
 * ko handle karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function listDocumentsHandler(req, res, next) {
  try {
    const { workspaceId, folderId, tag, favorited, search, sortBy, isArchived, page, limit } = req.query;
    const userId = getUserId(req);

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Query parameter "workspaceId" is required to list documents.',
      });
    }

    const result = await documentService.listDocuments(
      workspaceId,
      {
        folderId,
        tag,
        favorited,
        search,
        sortBy,
        isArchived: isArchived === 'true',
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
      },
      userId
    );

    return res.status(200).json({
      success: true,
      data: result.documents,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles document metadata updates (title, icon, cover image, folder).
 *
 * [ROMAN URDU]:
 * Document ke metadata fields (title, icon, cover, folderId) ko update karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function updateDocumentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const updated = await documentService.updateDocumentMetadata(id, req.body, userId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found or is archived.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document metadata updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles real-time debounced autosave of rich-text content with OCC conflict detection.
 *
 * [ROMAN URDU]:
 * Rich-text content autosave handler. Agar client ka `baseVersion` database ke version se match na kare
 * toh 409 Conflict return karta hai taake concurrent edits overwrite na hon.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function autosaveDocumentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const result = await documentService.autosaveDocumentContent(id, req.body, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found or is archived.`,
      });
    }

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        code: 'VERSION_CONFLICT',
        message: `Document version mismatch. Server has version ${result.currentVersion}, base was ${result.baseVersion}.`,
        serverDocument: result.serverDocument,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document autosaved successfully',
      data: {
        id: result.id,
        version: result.version,
        updatedAt: result.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles toggling star/favorite status for the authenticated user on a document.
 *
 * [ROMAN URDU]:
 * User ke liye document ka favorite star status toggle karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function toggleFavoriteHandler(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const result = await documentService.toggleFavoriteDocument(id, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.isFavorited ? 'Document starred' : 'Document unstarred',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles updating document tags.
 *
 * [ROMAN URDU]:
 * Document ke tags ko replace/update karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function updateTagsHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { tags } = req.body;
    const userId = getUserId(req);
    const updated = await documentService.updateDocumentTags(id, tags, userId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document tags updated successfully',
      data: { id: updated.id, tags: updated.tags },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles retrieving aggregated tags and usage counts for a workspace.
 *
 * [ROMAN URDU]:
 * Workspace ke tamam unique tags aur unke counts return karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function getWorkspaceTagsHandler(req, res, next) {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Query parameter "workspaceId" is required.',
      });
    }

    const tags = await documentService.getWorkspaceTags(workspaceId);
    return res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles linking a file attachment to a document.
 *
 * [ROMAN URDU]:
 * Document ke sath naya file attachment metadata link karta hai (201 status).
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function addAttachmentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const result = await documentService.addDocumentAttachment(id, req.body, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found.`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Attachment linked successfully',
      data: result.attachment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles unlinking an attachment from a document.
 *
 * [ROMAN URDU]:
 * Document se attachment delete / unlink karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function removeAttachmentHandler(req, res, next) {
  try {
    const { id, attachmentId } = req.params;
    const userId = getUserId(req);
    const updated = await documentService.removeDocumentAttachment(id, attachmentId, userId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Attachment removed successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles deep AST content searching across workspace documents.
 *
 * [ROMAN URDU]:
 * Document AST ke andar deep node type aur regex text match karke snippets return karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function astSearchHandler(req, res, next) {
  try {
    const { workspaceId, query, nodeTypes, tags, limit } = req.body;
    const results = await astSearchService.searchContentAst(workspaceId, {
      query,
      nodeTypes,
      tags,
      limit: limit ? parseInt(limit, 10) : 20,
    });

    return res.status(200).json({
      success: true,
      data: results,
      totalMatches: results.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles multi-document batch operations (archive, restore, move, tag, duplicate, delete_permanent).
 *
 * [ROMAN URDU]:
 * Ek sath multiple documents par batch operations (move, tag, delete, archive) execute karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function batchOperationsHandler(req, res, next) {
  try {
    const { action, documentIds, payload } = req.body;
    const userId = getUserId(req);
    const result = await batchService.executeBatchOperation(action, documentIds, payload, userId);

    return res.status(200).json({
      success: true,
      message: `Batch action '${action}' processed`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles duplicating an existing document.
 *
 * [ROMAN URDU]:
 * Mojooda document ka clone banata hai (201 Created).
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function duplicateDocumentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const duplicated = await documentService.duplicateDocument(id, userId);

    if (!duplicated) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found to duplicate.`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Document duplicated successfully',
      data: duplicated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles document export in markdown, json, or text format.
 *
 * [ROMAN URDU]:
 * Document ko requested format (Markdown, JSON, Plain Text) mein convert karke download headers ke sath send karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function exportDocumentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { format = 'markdown' } = req.query;
    const exported = await documentService.exportDocument(id, format);

    if (!exported) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found to export.`,
      });
    }

    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
    return res.status(200).send(exported.content);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles retrieving live document metrics and reading statistics.
 *
 * [ROMAN URDU]:
 * Document ke word count, character count, aur reading time statistics return karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function getDocumentStatsHandler(req, res, next) {
  try {
    const { id } = req.params;
    const stats = await documentService.getDocumentStats(id);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles moving a document to the trash bin (30-day retention).
 *
 * [ROMAN URDU]:
 * Document ko 30-day retention schedule ke sath trash bin mein bhejta hai (soft-delete).
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function archiveDocumentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const archived = await documentService.moveToTrash(id, userId);

    if (!archived) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found or already in trash.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document moved to trash successfully (retained for 30 days)',
      data: {
        id: archived.id,
        deletedAt: archived.deletedAt,
        scheduledPermanentDeletionAt: archived.scheduledPermanentDeletionAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles restoring an archived document from the trash bin.
 *
 * [ROMAN URDU]:
 * Trash bin se document ko restore karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function restoreDocumentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { targetFolderId } = req.body || {};
    const userId = getUserId(req);
    const restored = await documentService.restoreFromTrash(id, userId, targetFolderId);

    if (!restored) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Archived document with ID '${id}' was not found in trash.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document restored from trash successfully',
      data: restored,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles listing documents in the trash bin for a workspace.
 *
 * [ROMAN URDU]:
 * Workspace ke trash bin mein mojood documents list karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function listTrashHandler(req, res, next) {
  try {
    const { workspaceId, page, limit } = req.query;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Query parameter "workspaceId" is required.',
      });
    }

    const result = await documentService.listTrashDocuments(workspaceId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });

    return res.status(200).json({
      success: true,
      data: result.documents,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles permanently purging a document from the database.
 *
 * [ROMAN URDU]:
 * Trash mein mojood document ko database se permanently delete karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function permanentDeleteHandler(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const deleted = await documentService.permanentlyDeleteDocument(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found in trash to delete permanently.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document permanently deleted from database',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles emptying all trash documents for a workspace.
 *
 * [ROMAN URDU]:
 * Workspace ke tamam trash documents ko aik request mein permanently purge karta hai.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
export async function emptyTrashHandler(req, res, next) {
  try {
    const { workspaceId } = req.body;
    const userId = getUserId(req);

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'workspaceId is required in request body.',
      });
    }

    const result = await documentService.emptyWorkspaceTrash(workspaceId, userId);

    return res.status(200).json({
      success: true,
      message: `Trash emptied (${result.deletedCount} documents permanently removed)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
}
