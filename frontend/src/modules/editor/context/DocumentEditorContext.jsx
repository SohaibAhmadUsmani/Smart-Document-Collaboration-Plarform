/**
 * @file DocumentEditorContext.jsx
 * @description React Context Provider and hook for centralized document editor state management.
 * @module frontend/src/modules/editor/context/DocumentEditorContext
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh component Document Editor ka main React Context Provider hai. Iske zariye document data,
 * active formatting marks, autosave state, aur permissions pure editor component tree mein
 * bina prop drilling ke available hoti hain.
 */

import React, { createContext, useReducer, useContext, useMemo } from 'react';
import { documentEditorReducer, initialEditorState } from './documentEditorReducer.js';

const DocumentEditorContext = createContext(null);

/**
 * Provider component wrapping the Document Editor tree.
 *
 * [ROMAN URDU]:
 * Editor components ke ird gird Provider wrap karta hai aur reducer state aur dispatch function provide karta hai.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child UI components
 * @param {string|null} [props.initialDocumentId=null] - Initial document ObjectId
 * @param {boolean} [props.initialReadOnly=false] - Initial read-only flag
 * @returns {React.JSX.Element}
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
 *
 * [ROMAN URDU]:
 * Reducer context access karne ka custom hook. Agar provider ke bahar call kiya jaye toh error deta hai.
 *
 * @returns {{ state: Object, dispatch: Function }} Context value
 * @throws {Error} If called outside DocumentEditorProvider
 */
export function useDocumentEditorContext() {
  const context = useContext(DocumentEditorContext);
  if (!context) {
    throw new Error('useDocumentEditorContext must be used within a DocumentEditorProvider');
  }
  return context;
}
