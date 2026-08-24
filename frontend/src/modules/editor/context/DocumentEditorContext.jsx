import React, { createContext, useReducer, useContext, useMemo } from 'react';
import { documentEditorReducer, initialEditorState } from './documentEditorReducer.js';

const DocumentEditorContext = createContext(null);

/**
 * Provider component wrapping the Document Editor tree.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string|null} [props.initialDocumentId=null]
 * @param {boolean} [props.initialReadOnly=false]
 */
export function DocumentEditorProvider({
  children,
  initialDocumentId = null,
  initialReadOnly = false,
}) {
  const [state, dispatch] = useReducer(documentEditorReducer, {
    ...initialEditorState,
    documentId: initialDocumentId,
    isReadOnly: initialReadOnly,
  });

  const contextValue = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <DocumentEditorContext.Provider value={contextValue}>
      {children}
    </DocumentEditorContext.Provider>
  );
}

/**
 * Custom hook to access Document Editor context.
 */
export function useDocumentEditorContext() {
  const context = useContext(DocumentEditorContext);
  if (!context) {
    throw new Error('useDocumentEditorContext must be used within a DocumentEditorProvider');
  }
  return context;
}
