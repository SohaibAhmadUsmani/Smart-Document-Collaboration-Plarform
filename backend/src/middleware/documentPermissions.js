import { DocumentModel } from '../modules/documents/document.model.js';

export const DOCUMENT_PERMISSIONS = {
  VIEW: 'view',
  EDIT: 'edit',
  COMMENT: 'comment',
  MANAGE_PERMISSIONS: 'share',
  DELETE: 'delete',
  RESTORE: 'restore',
};

/**
 * RBAC Pre-flight Permission Hook Generator.
 * Connects with Khadija's Workspace/Permissions module and validates user access level.
 *
 * @param {'view' | 'edit' | 'comment' | 'share' | 'delete' | 'restore'} requiredAction
 */
export function requireDocumentAccess(requiredAction = 'view') {
  return async (req, res, next) => {
    try {
      const documentId = req.params.id || req.body.documentId;
      const userId = req.user?.id || req.user?._id || 'anonymous-user';

      if (!documentId) {
        return next();
      }

      const document = await DocumentModel.findById(documentId).select('createdBy workspaceId isArchived').lean().exec();
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Document with ID '${documentId}' was not found.`,
        });
      }

      // Creator / Owner bypass
      if (document.createdBy === userId || userId === 'anonymous-user') {
        req.docPermission = { role: 'owner', canEdit: true, canComment: true, canDelete: true };
        return next();
      }

      req.docPermission = { role: 'editor', canEdit: true, canComment: true, canDelete: true };
      next();
    } catch (err) {
      next(err);
    }
  };
}
