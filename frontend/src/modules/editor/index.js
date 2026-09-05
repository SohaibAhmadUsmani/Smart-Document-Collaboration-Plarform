/**
 * @file index.js
 * @description Public barrel export file for the DocSync Pro Document Editor module.
 * Exposes core canvas components, context provider, hooks, extensions, services, and utility helpers.
 * @module frontend/src/modules/editor
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh Document Editor module ka main barrel export file hai.
 * Yahan se EditorCanvas, DocumentCanvas, FormattingToolbar, context provider,
 * custom hooks, aur AST utility functions bahir export kiye jaate hain.
 */

// Core Components
export { EditorCanvas, default } from './components/EditorCanvas.jsx';
export { DocumentCanvas } from './components/DocumentCanvas.jsx';
export { PaperDocumentSheet } from './components/PaperDocumentSheet.jsx';
export { TopGlobalHeader } from './components/TopGlobalHeader.jsx';
export { DocSubHeader } from './components/DocSubHeader.jsx';
export { FormattingToolbar } from './components/FormattingToolbar.jsx';
export { EditorToolbar } from './components/EditorToolbar.jsx';
export { EditorHeader } from './components/EditorHeader.jsx';
export { EditorActions } from './components/EditorActions.jsx';
export { CollaborationSidebar } from './components/CollaborationSidebar.jsx';
export { BottomStatusBar } from './components/BottomStatusBar.jsx';
export { DocumentOutline } from './components/DocumentOutline.jsx';
export { DocumentStats } from './components/DocumentStats.jsx';
export { SaveStatusIndicator } from './components/SaveStatusIndicator.jsx';
export { SlashCommandMenu } from './components/SlashCommandMenu.jsx';
export { TableCellMenu } from './components/TableCellMenu.jsx';
export { TagFavoriteBar } from './components/TagFavoriteBar.jsx';
export { BubbleFloatingMenu } from './components/BubbleFloatingMenu.jsx';
export { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal.jsx';

// Context & Reducer
export { DocumentEditorProvider, useDocumentEditorContext } from './context/DocumentEditorContext.jsx';
export { documentEditorReducer, initialEditorState } from './context/documentEditorReducer.js';

// Custom Hooks
export { useDocumentEditor } from './hooks/useDocumentEditor.js';
export { useTipTapEditor } from './hooks/useTipTapEditor.js';
export { useAutosave } from './hooks/useAutosave.js';
export { useCommentAnchors } from './hooks/useCommentAnchors.js';
export { useDocumentAttachments } from './hooks/useDocumentAttachments.js';
export { useDocumentPermissions } from './hooks/useDocumentPermissions.js';
export { useDocumentSearch } from './hooks/useDocumentSearch.js';
export { useDocumentTagsFavorites } from './hooks/useDocumentTagsFavorites.js';

// Types & Contracts
export { SAVE_STATUS, DEFAULT_DOCUMENT_AST, AUTOSAVE_DEFAULT_DEBOUNCE_MS, DOCUMENT_ACTIONS } from './types/document.js';
export { ANCHOR_TYPES, createCommentAnchor } from './types/commentAnchor.js';

// AST & Motion Utilities
export { extractPlainTextFromAst, astToMarkdown } from './utils/astConverters.js';
export { extractHeadingsOutline, findNodesByType, extractNodeText } from './utils/astWalker.js';
export { resolveCommentAnchorPosition } from './utils/fuzzyAnchorMatcher.js';
export * from './utils/motionVariants.js';

// API Services & Fixtures
export * from './services/documentApi.js';

// TipTap Extensions & Schema
export { getEditorExtensions } from './extensions/schema.js';
export { CommentMark } from './extensions/marks/CommentMark.js';
export { AttachmentNode } from './extensions/nodes/AttachmentNode.js';
export { CalloutNode } from './extensions/nodes/CalloutNode.js';
export { CodeBlockNode } from './extensions/nodes/CodeBlockNode.js';
export { MentionNode } from './extensions/nodes/MentionNode.js';
export { Table, TableRow, TableHeader, TableCell } from './extensions/nodes/TableNodes.js';
