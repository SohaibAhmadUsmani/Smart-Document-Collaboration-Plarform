/**
 * @file useDocumentEditor.js
 * @description Primary state access hook providing strongly typed dispatch helper methods.
 * Simplifies interactions with DocumentEditorContext.
 * @module frontend/src/modules/editor/hooks/useDocumentEditor
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh hook DocumentEditorContext ki state aur tamam helper dispatch actions
 * (setDocument, updateTitle, updateContent, etc.) ko asan API mein wrap karke provide karta hai.
 */

import { useDocumentEditorContext } from '../context/DocumentEditorContext.jsx';
import { DOCUMENT_ACTIONS } from '../types/document.js';

/**
 * Accessor hook providing document editor state and dispatch helpers.
 *
 * [ROMAN URDU]:
 * Editor state aur actions return karta hai.
 *
 * @returns {{ state: Object, dispatch: Function, setDocument: Function, updateTitle: Function, updateContent: Function, setSaveStatus: Function, setIsReadOnly: Function, toggleFavorite: Function, setTags: Function, addAttachment: Function, removeAttachment: Function, setActiveMarks: Function, setActiveCommentThread: Function, setSearchQuery: Function, setPermissions: Function }}
 */
export function useDocumentEditor() {
  const { state, dispatch } = useDocumentEditorContext();

  const setDocument = (doc) => dispatch({ type: DOCUMENT_ACTIONS.SET_DOCUMENT, payload: doc });
  const updateTitle = (title) => dispatch({ type: DOCUMENT_ACTIONS.UPDATE_TITLE, payload: title });
  const updateContent = (content, plainText) =>
    dispatch({ type: DOCUMENT_ACTIONS.UPDATE_CONTENT, payload: { content, plainText } });
  const setSaveStatus = (status, extra = {}) =>
    dispatch({ type: DOCUMENT_ACTIONS.SET_SAVE_STATUS, payload: { status, ...extra } });
  const setIsReadOnly = (isReadOnly) =>
    dispatch({ type: DOCUMENT_ACTIONS.SET_IS_READ_ONLY, payload: isReadOnly });
  const toggleFavorite = () => dispatch({ type: DOCUMENT_ACTIONS.TOGGLE_FAVORITE });
  const setTags = (tags) => dispatch({ type: DOCUMENT_ACTIONS.SET_TAGS, payload: tags });
  const addAttachment = (attachment) =>
    dispatch({ type: DOCUMENT_ACTIONS.ADD_ATTACHMENT, payload: attachment });
  const removeAttachment = (attachmentId) =>
    dispatch({ type: DOCUMENT_ACTIONS.REMOVE_ATTACHMENT, payload: attachmentId });
  const setActiveMarks = (marks) =>
    dispatch({ type: DOCUMENT_ACTIONS.SET_ACTIVE_MARKS, payload: marks });
  const setActiveCommentThread = (threadId) =>
    dispatch({ type: DOCUMENT_ACTIONS.SET_ACTIVE_COMMENT_THREAD, payload: threadId });
  const setSearchQuery = (query) =>
    dispatch({ type: DOCUMENT_ACTIONS.SET_SEARCH_QUERY, payload: query });
  const setPermissions = (perms) =>
    dispatch({ type: DOCUMENT_ACTIONS.SET_PERMISSIONS, payload: perms });
  const setConflict = (conflictData) =>
    dispatch({ type: DOCUMENT_ACTIONS.SET_CONFLICT, payload: conflictData });
  const resolveConflict = (payload) =>
    dispatch({ type: DOCUMENT_ACTIONS.RESOLVE_CONFLICT, payload });

  return {
    state,
    dispatch,
    setDocument,
    updateTitle,
    updateContent,
    setSaveStatus,
    setIsReadOnly,
    toggleFavorite,
    setTags,
    addAttachment,
    removeAttachment,
    setActiveMarks,
    setActiveCommentThread,
    setSearchQuery,
    setPermissions,
    setConflict,
    resolveConflict,
  };
}
