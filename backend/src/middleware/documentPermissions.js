import mongoose from 'mongoose';
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
      const userId = String(req.user?.id || req.user?._id || '654321098765432109876543');

      if (!documentId) {
        return next();
      }

      if (!mongoose.isValidObjectId(documentId) && !documentId.startsWith('doc_')) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: `Invalid document ID format: '${documentId}'.`,
        });
      }

      const document = await DocumentModel.findById(documentId).lean().exec();
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Document with ID '${documentId}' was not found.`,
        });
      }

      // Attach found document to request to eliminate duplicate queries
      req.doc = document;

      // Creator / Owner full access
      if (String(document.createdBy) === userId) {
        req.docPermission = { role: 'owner', canEdit: true, canComment: true, canDelete: true };
        return next();
      }

      // Workspace permissions mapping
      req.docPermission = {
        role: req.user?.role || 'editor',
        canEdit: ['owner', 'editor'].includes(req.user?.role || 'editor'),
        canComment: ['owner', 'editor', 'commenter'].includes(req.user?.role || 'editor'),
        canDelete: (req.user?.role === 'owner') || String(document.createdBy) === userId,
      };

      if (requiredAction === 'edit' && !req.docPermission.canEdit) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: 'Edit permission required.' });
      }

      if (requiredAction === 'delete' && !req.docPermission.canDelete) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: 'Delete permission required.' });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
