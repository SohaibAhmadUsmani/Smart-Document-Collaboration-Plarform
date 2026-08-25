/**
 * Document Editor Module Public API (DocSync Pro)
 */

// Core High-Fidelity Components
export { EditorCanvas } from './components/EditorCanvas.jsx';
export { TopGlobalHeader } from './components/TopGlobalHeader.jsx';
export { DocSubHeader } from './components/DocSubHeader.jsx';
export { FormattingToolbar } from './components/FormattingToolbar.jsx';
export { PaperDocumentSheet } from './components/PaperDocumentSheet.jsx';
export { CollaborationSidebar } from './components/CollaborationSidebar.jsx';
export { BottomStatusBar } from './components/BottomStatusBar.jsx';

// Supporting Components
export { EditorHeader } from './components/EditorHeader.jsx';
export { EditorToolbar } from './components/EditorToolbar.jsx';
export { EditorActions } from './components/EditorActions.jsx';
export { DocumentCanvas } from './components/DocumentCanvas.jsx';
export { DocumentStats } from './components/DocumentStats.jsx';
export { DocumentOutline } from './components/DocumentOutline.jsx';
export { TagFavoriteBar } from './components/TagFavoriteBar.jsx';
export { SaveStatusIndicator } from './components/SaveStatusIndicator.jsx';

// Context & Provider
export { DocumentEditorProvider, useDocumentEditorContext } from './context/DocumentEditorContext.jsx';
export { documentEditorReducer, initialEditorState } from './context/documentEditorReducer.js';

// Custom Hooks
export { useDocumentEditor } from './hooks/useDocumentEditor.js';
export { useTipTapEditor } from './hooks/useTipTapEditor.js';
export { useAutosave } from './hooks/useAutosave.js';
export { useCommentAnchors } from './hooks/useCommentAnchors.js';
export { useDocumentAttachments } from './hooks/useDocumentAttachments.js';
export { useDocumentTagsFavorites } from './hooks/useDocumentTagsFavorites.js';
export { useDocumentSearch } from './hooks/useDocumentSearch.js';
export { useDocumentPermissions } from './hooks/useDocumentPermissions.js';

// Extensions & Schema
export { getEditorExtensions } from './extensions/schema.js';
export { CommentMark } from './extensions/marks/CommentMark.js';
export { CalloutNode } from './extensions/nodes/CalloutNode.js';
export { AttachmentNode } from './extensions/nodes/AttachmentNode.js';
export { CodeBlockNode } from './extensions/nodes/CodeBlockNode.js';
export { MentionNode } from './extensions/nodes/MentionNode.js';

// Utilities & Motion Tokens
export { astToMarkdown } from './utils/astConverters.js';
export { extractHeadingsOutline, findNodesByType, extractNodeText } from './utils/astWalker.js';
export { resolveCommentAnchorPosition } from './utils/fuzzyAnchorMatcher.js';
export * from './utils/motionVariants.js';

// Types & Mock/API Services
export * from './types/document.js';
export * from './types/commentAnchor.js';
export * from './services/documentApi.js';
export * from './services/mockData.js';
