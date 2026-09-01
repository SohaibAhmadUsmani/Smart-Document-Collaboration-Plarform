import { createContext, useContext } from 'react';

/**
 * Document Navigation Context
 *
 * Enables cross-component navigation (e.g., clicking a notification
 * to open a specific document and optionally focus a comment).
 *
 * Provided by EditorCanvas, consumed by NotificationBell/NotificationItem.
 */
const DocumentNavigationContext = createContext({
  navigateToDocument: () => {},
  currentDocumentId: null,
});

export const DocumentNavigationProvider = DocumentNavigationContext.Provider;

export function useDocumentNavigation() {
  return useContext(DocumentNavigationContext);
}
