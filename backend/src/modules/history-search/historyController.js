import mongoose from 'mongoose';
import * as historyService from './historyService.js';
import { DocumentModel } from '../documents/document.model.js';
import { permissionService } from '../workspaces/services/permissionService.js';
import { WorkspaceMember } from '../workspaces/models/WorkspaceMember.js';
import { Workspace } from '../workspaces/models/Workspace.js';

/**
 * Verifies if user has permission to perform action on a document's workspace.
 */
async function checkDocAccess(userId, documentId, requiredAction = 'view') {
  if (mongoose.connection?.readyState !== 1 || !mongoose.isValidObjectId(documentId)) {
    return true;
  }
  const doc = await DocumentModel.findById(documentId).lean();
  if (!doc) return true;
  if (!userId) return false;
  if (String(doc.createdBy) === String(userId)) return true;
  const userRole = await permissionService.getUserRole(userId, doc.workspaceId);
  if (!userRole) return false;
  return permissionService.roleSatisfiesAction(userRole, requiredAction);
}

/**
 * GET /api/history-search/documents/:documentId/history
 * Fetches all versions of a document.
 */
export async function handleGetHistory(req, res, next) {
  try {
    const { documentId } = req.params;
    const userId = req.user?.id || req.user?._id;
    const allowed = await checkDocAccess(userId, documentId, 'view');
    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied. You do not have view access to this document history.',
      });
    }

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
    const userId = req.user?.id || req.user?._id;
    const allowed = await checkDocAccess(userId, documentId, 'edit');
    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied. You do not have edit access to create a version snapshot.',
      });
    }

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

    const userId = req.user?.id || req.user?._id;
    if (version?.documentId) {
      const allowed = await checkDocAccess(userId, version.documentId, 'view');
      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Access denied. You do not have view access to this version snapshot.',
        });
      }
    }

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
    const userId = req.user?.id || req.user?._id;
    const allowed = await checkDocAccess(userId, documentId, 'edit');
    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied. You do not have edit access to restore this document version.',
      });
    }

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
 * Performs global search for documents by keyword, isolated to accessible workspaces.
 */
export async function handleSearch(req, res, next) {
  try {
    const { q } = req.query;
    const userId = String(req.user?.id || req.user?._id || '');

    // Resolve user's accessible workspaces
    let accessibleWorkspaceIds = [];
    if (mongoose.connection?.readyState === 1 && userId && mongoose.isValidObjectId(userId)) {
      try {
        const memberships = await WorkspaceMember.find({ user: userId }).select('workspace').lean();
        const owned = await Workspace.find({ owner: userId }).select('_id').lean();
        accessibleWorkspaceIds = Array.from(new Set([
          ...memberships.map(m => String(m.workspace)),
          ...owned.map(w => String(w._id))
        ]));
      } catch {
        // Continue with empty list if query fails
      }
    }

    const results = await historyService.searchAllDocuments(q, accessibleWorkspaceIds, userId);

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
    const version = await historyService.getVersionDetails(versionId);

    const userId = req.user?.id || req.user?._id;
    if (version?.documentId) {
      const allowed = await checkDocAccess(userId, version.documentId, 'delete');
      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Access denied. Version history snapshots are immutable audit records and can only be managed by the document owner.',
        });
      }
    }

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

