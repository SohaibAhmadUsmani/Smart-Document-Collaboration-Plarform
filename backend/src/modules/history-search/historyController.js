/**
 * historyController.js
 * Owner: Aiman
 * 
 * Express request/response controller handlers for Version History & Search.
 */

import * as historyService from './historyService.js';

/**
 * GET /api/history-search/documents/:documentId/history
 * Fetches all versions of a document.
 */
export async function handleGetHistory(req, res, next) {
  try {
    const { documentId } = req.params;
    const history = await historyService.getHistoryByDocumentId(documentId);

    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/history-search/documents/:documentId/history
 * Creates a new version snapshot for a document.
 */
export async function handleCreateSnapshot(req, res, next) {
  try {
    const { documentId } = req.params;
    const { title, content, changeSummary, createdBy: clientCreatedBy } = req.body;
    const createdBy = clientCreatedBy || req.user?.name || req.user?.email || 'Active Collaborator';

    const newSnapshot = await historyService.createSnapshot({
      documentId,
      title,
      content,
      createdBy,
      changeSummary
    });

    res.status(201).json({
      success: true,
      message: 'Version snapshot created successfully',
      data: newSnapshot
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/history-search/versions/:versionId
 * Gets details of a specific version snapshot.
 */
export async function handleGetVersion(req, res, next) {
  try {
    const { versionId } = req.params;
    const version = await historyService.getVersionDetails(versionId);

    res.json({
      success: true,
      data: version
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/history-search/documents/:documentId/restore/:versionId
 * Restores a past document version.
 */
export async function handleRestoreVersion(req, res, next) {
  try {
    const { documentId, versionId } = req.params;
    const { restoredBy: clientRestoredBy } = req.body;
    const restoredBy = clientRestoredBy || req.user?.name || req.user?.email || 'Active Collaborator';

    const restoredVersion = await historyService.restoreVersionSnapshot(
      documentId,
      versionId,
      restoredBy
    );

    res.json({
      success: true,
      message: `Document restored successfully to Version #${restoredVersion.versionNumber}`,
      data: restoredVersion
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/history-search/diff
 * Calculates text differences between two version IDs.
 */
export async function handleGetDiff(req, res, next) {
  try {
    const { oldVersionId, newVersionId } = req.query;

    if (!oldVersionId || !newVersionId) {
      return res.status(400).json({
        success: false,
        message: 'Both oldVersionId and newVersionId query parameters are required'
      });
    }

    const diffResult = await historyService.calculateDiff(oldVersionId, newVersionId);

    res.json({
      success: true,
      data: diffResult
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/history-search/search
 * Performs global search for documents by keyword.
 */
export async function handleSearch(req, res, next) {
  try {
    const { q } = req.query;
    const results = await historyService.searchAllDocuments(q);

    res.json({
      success: true,
      query: q || '',
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/history-search/versions/:versionId
 * Deletes a version snapshot.
 */
export async function handleDeleteVersion(req, res, next) {
  try {
    const { versionId } = req.params;
    const deleted = await historyService.deleteVersionSnapshot(versionId);

    res.json({
      success: true,
      message: `Version #${deleted.versionNumber} deleted successfully`,
      data: deleted
    });
  } catch (error) {
    next(error);
  }
}
