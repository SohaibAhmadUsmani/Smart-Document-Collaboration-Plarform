import * as documentService from './document.service.js';
import * as batchService from './documentBatch.service.js';
import * as astSearchService from './documentAstSearch.service.js';

function getUserId(req) {
  return req.user?.id || req.user?._id || 'anonymous-user';
}

/**
 * Handler to create a new document.
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
 * Handler to fetch a single document by ID.
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
 * Handler to list documents for a workspace with sorting, tags, favorites, and search.
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
 * Handler to update document metadata.
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
 * Handler to autosave document rich-text content.
 */
export async function autosaveDocumentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const updated = await documentService.autosaveDocumentContent(id, req.body, userId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found or is archived.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document autosaved successfully',
      data: {
        id: updated.id,
        version: updated.version,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handler to toggle star/favorite on a document.
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
 * Handler to update document tags.
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
 * Handler to get all unique tags across a workspace.
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
 * Handler to link an attachment reference to a document.
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
 * Handler to unlink an attachment.
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
 * Handler for deep AST content search.
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
 * Handler for multi-document batch operations.
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
 * Handler to duplicate an existing document.
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
 * Handler to export document content.
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
 * Handler to retrieve word count and reading statistics.
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
 * Handler to move document to trash (30-day retention).
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
 * Handler to restore an archived document from trash.
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
 * Handler to list trash documents.
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
 * Handler to permanently delete a document.
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
 * Handler to empty all trash for a workspace.
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
