import * as documentService from './document.service.js';

/**
 * Helper to retrieve user ID from request (set by Maira's Auth middleware).
 */
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
 * Handler to list documents for a workspace with sorting & search.
 */
export async function listDocumentsHandler(req, res, next) {
  try {
    const { workspaceId, folderId, search, sortBy, isArchived, page, limit } = req.query;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Query parameter "workspaceId" is required to list documents.',
      });
    }

    const result = await documentService.listDocuments(workspaceId, {
      folderId,
      search,
      sortBy,
      isArchived: isArchived === 'true',
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
 * Handler to duplicate / clone an existing document.
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
 * Handler to export document content in Markdown, JSON, or Text format.
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

    // Set download headers
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);

    return res.status(200).send(exported.content);
  } catch (error) {
    next(error);
  }
}

/**
 * Handler to retrieve word count and reading statistics for a document.
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
 * Handler to soft-delete / archive a document.
 */
export async function archiveDocumentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const archived = await documentService.archiveDocument(id, userId);

    if (!archived) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Document with ID '${id}' was not found or already archived.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document moved to archive successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handler to restore an archived document.
 */
export async function restoreDocumentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const restored = await documentService.restoreDocument(id, userId);

    if (!restored) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Archived document with ID '${id}' was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document restored successfully',
      data: restored,
    });
  } catch (error) {
    next(error);
  }
}
