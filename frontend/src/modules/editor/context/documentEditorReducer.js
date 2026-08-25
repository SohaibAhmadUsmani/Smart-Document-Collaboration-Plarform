import { SAVE_STATUS, DEFAULT_DOCUMENT_AST, DOCUMENT_ACTIONS } from '../types/document.js';

export const initialEditorState = {
  documentId: null,
  workspaceId: null,
  folderId: null,
  title: 'Untitled Document',
  icon: null,
  coverImage: null,
  content: null,
  plainText: '',
  tags: [],
  isFavorite: false,
  favoriteCount: 0,
  attachments: [],
  version: 1,

  // Editing & Sync State
  isReadOnly: false,
  saveStatus: SAVE_STATUS.IDLE,
  lastSavedAt: null,
  saveError: null,
  isDirty: false,

  // Active Formatting & Selection State
  activeMarks: {},
  activeBlockType: 'paragraph',

  // Comments & Search
  activeCommentThreadId: null,
  searchQuery: '',

  // Permissions State
  permissions: {
    role: 'editor',
    canEdit: true,
    canComment: true,
    canDelete: false,
    canShare: false,
  },
};

export function documentEditorReducer(state, action) {
  switch (action.type) {
    case DOCUMENT_ACTIONS.SET_DOCUMENT: {
      const doc = action.payload || {};
      return {
        ...state,
        documentId: doc.id || doc._id || state.documentId,
        workspaceId: doc.workspaceId || state.workspaceId,
        folderId: doc.folderId || null,
        title: doc.title || 'Untitled Document',
        icon: doc.icon || null,
        coverImage: doc.coverImage || null,
        content: doc.content || DEFAULT_DOCUMENT_AST,
        plainText: doc.plainText || '',
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        isFavorite: Boolean(doc.isFavorite),
        favoriteCount: doc.favoritedBy?.length || 0,
        attachments: Array.isArray(doc.attachments) ? doc.attachments : [],
        version: doc.version || 1,
        isDirty: false,
        saveStatus: SAVE_STATUS.SAVED,
        lastSavedAt: doc.updatedAt ? new Date(doc.updatedAt) : null,
      };
    }

    case DOCUMENT_ACTIONS.UPDATE_TITLE:
      return {
        ...state,
        title: action.payload,
        isDirty: true,
      };

    case DOCUMENT_ACTIONS.UPDATE_CONTENT:
      return {
        ...state,
        content: action.payload.content,
        plainText: action.payload.plainText !== undefined ? action.payload.plainText : state.plainText,
        isDirty: true,
      };

    case DOCUMENT_ACTIONS.SET_SAVE_STATUS:
      return {
        ...state,
        saveStatus: action.payload.status,
        lastSavedAt: action.payload.lastSavedAt || state.lastSavedAt,
        saveError: action.payload.error || null,
        isDirty: action.payload.status === SAVE_STATUS.SAVED ? false : state.isDirty,
        version: action.payload.version || state.version,
      };

    case DOCUMENT_ACTIONS.SET_IS_READ_ONLY:
      return {
        ...state,
        isReadOnly: Boolean(action.payload),
      };

    case DOCUMENT_ACTIONS.TOGGLE_FAVORITE:
      return {
        ...state,
        isFavorite: !state.isFavorite,
        favoriteCount: state.isFavorite ? Math.max(0, state.favoriteCount - 1) : state.favoriteCount + 1,
      };

    case DOCUMENT_ACTIONS.SET_TAGS:
      return {
        ...state,
        tags: Array.isArray(action.payload) ? action.payload : state.tags,
      };

    case DOCUMENT_ACTIONS.ADD_ATTACHMENT:
      return {
        ...state,
        attachments: [...state.attachments, action.payload],
      };

    case DOCUMENT_ACTIONS.REMOVE_ATTACHMENT:
      return {
        ...state,
        attachments: state.attachments.filter((a) => a.attachmentId !== action.payload),
      };

    case DOCUMENT_ACTIONS.SET_ACTIVE_MARKS:
      return {
        ...state,
        activeMarks: action.payload || {},
      };

    case DOCUMENT_ACTIONS.SET_ACTIVE_COMMENT_THREAD:
      return {
        ...state,
        activeCommentThreadId: action.payload,
      };

    case DOCUMENT_ACTIONS.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload || '',
      };

    case DOCUMENT_ACTIONS.SET_PERMISSIONS:
      return {
        ...state,
        permissions: {
          ...state.permissions,
          ...action.payload,
        },
      };

    default:
      return state;
  }
}
