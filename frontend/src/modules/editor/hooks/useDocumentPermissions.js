import { useDocumentEditor } from './useDocumentEditor.js';

/**
 * Reactive hook evaluating document permissions (Owner, Editor, Commenter, Viewer).
 */
export function useDocumentPermissions() {
  const { state } = useDocumentEditor();
  const perms = state.permissions;

  return {
    role: perms.role,
    canEdit: perms.canEdit && !state.isReadOnly,
    canComment: perms.canComment,
    canDelete: perms.canDelete,
    canShare: perms.canShare,
    isOwner: perms.role === 'owner',
    isViewerOnly: perms.role === 'viewer',
    isCommenterOnly: perms.role === 'commenter',
  };
}
