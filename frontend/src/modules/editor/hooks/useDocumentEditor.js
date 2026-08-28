import { useDocumentEditorContext } from '../context/DocumentEditorContext.jsx';
import { DOCUMENT_ACTIONS } from '../types/document.js';

/**
 * Accessor hook providing document editor state and dispatch helpers.
 */
export function useDocumentEditor() {
  const { state, dispatch } = useDocumentEditorContext();

  const setDocument = (doc) => dispatch({ type: DOCUMENT_ACTIONS.SET_DOCUMENT, payload: doc });
  const setDocumentId = (id) => dispatch({ type: DOCUMENT_ACTIONS.SET_DOCUMENT_ID, payload: id });
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

  return {
    state,
    dispatch,
    setDocument,
    setDocumentId,
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
  };
}
