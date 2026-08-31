/**
 * @file useDocumentPermissions.js
 * @description Reactive hook evaluating user document permissions (Owner, Editor, Commenter, Viewer).
 * Interoperates with Khadija's Workspaces Role-Based Access Control (RBAC).
 * @module frontend/src/modules/editor/hooks/useDocumentPermissions
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh hook user ke document permissions (canEdit, canComment, canDelete, canShare)
 * ko evaluate karta hai. Agar document `isReadOnly` mode mein ho toh `canEdit` false ho jata hai.
 */

import { useDocumentEditor } from './useDocumentEditor.js';

/**
 * Reactive hook evaluating document permissions.
 *
 * [ROMAN URDU]:
 * Current user ke role aur capabilities flags return karta hai.
 *
 * @returns {{ role: string, canEdit: boolean, canComment: boolean, canDelete: boolean, canShare: boolean, isOwner: boolean, isViewerOnly: boolean, isCommenterOnly: boolean }}
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
