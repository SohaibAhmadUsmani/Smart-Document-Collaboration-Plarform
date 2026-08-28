import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { DocumentEditorProvider, useDocumentEditorContext } from '../context/DocumentEditorContext.jsx';
import { DocumentNavigationProvider } from '../context/DocumentNavigationContext.jsx';
import { useDocumentEditor } from '../hooks/useDocumentEditor.js';
import { useTipTapEditor } from '../hooks/useTipTapEditor.js';
import { useAutosave } from '../hooks/useAutosave.js';
import { useCommentAnchors } from '../hooks/useCommentAnchors.js';
import { plainTextOffsetToProseMirrorPos } from '../utils/plainTextOffsetToProseMirrorPos.js';
import { TopGlobalHeader } from './TopGlobalHeader.jsx';
import { DocSubHeader } from './DocSubHeader.jsx';
import { FormattingToolbar } from './FormattingToolbar.jsx';
import { PaperDocumentSheet } from './PaperDocumentSheet.jsx';
import { BottomStatusBar } from './BottomStatusBar.jsx';
import { SlashCommandMenu } from './SlashCommandMenu.jsx';
import { BubbleFloatingMenu } from './BubbleFloatingMenu.jsx';
import { TableCellMenu } from './TableCellMenu.jsx';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal.jsx';
import { CommentsPanel } from '../../comments/components/CommentsPanel.jsx';
import { apiGetDocument, apiAddAttachment } from '../services/documentApi.js';
import { MOCK_INITIAL_DOCUMENT } from '../services/mockData.js';
import { SAVE_STATUS } from '../types/document.js';

const PRIMARY_LIVE_SEED_ID = '66cc00000000000000000001';

function EditorCanvasInner({ onDocumentArchived, onDocumentDuplicated }) {
  const { state, setDocument, setDocumentId, updateTitle, addAttachment, setActiveCommentThread } = useDocumentEditor();
  const { editorRef, isReady, executeCommand, editorInstance } = useTipTapEditor({
    initialContent: state.content || MOCK_INITIAL_DOCUMENT.content,
  });

  // Comment anchor integration
  const {
    captureSelectionAnchor,
    attachCommentMark,
    resolveAnchor,
    activeCommentThreadId,
  } = useCommentAnchors(editorInstance);

  const [isLoading, setIsLoading] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  // Comment mark hydration state
  const hydratedCommentIdsRef = useRef(new Set());
  const [loadedComments, setLoadedComments] = useState(null);

  // Slash Command Menu state
  const [slashMenu, setSlashMenu] = useState({
    isOpen: false,
    query: '',
    position: { top: 0, left: 0 },
  });

  // Notification navigation state
  const pendingNavigationCommentIdRef = useRef(null);

  // Focus a comment by its ID in the editor
  const focusCommentById = useCallback((commentId) => {
    if (!editorInstance) return;

    // Set the active comment thread in the sidebar
    setActiveCommentThread(commentId);

    // Try to find the comment mark in the document and scroll to it
    try {
      const { state: editorState } = editorInstance;
      const { doc } = editorState;
      let foundPos = null;

      doc.descendants((node, pos) => {
        if (foundPos) return false;
        if (node.marks) {
          for (const mark of node.marks) {
            if (mark.type.name === 'commentMark' && mark.attrs.commentThreadId === commentId) {
              foundPos = pos;
              return false;
            }
          }
        }
      });

      if (foundPos !== null) {
        editorInstance.chain().focus().setTextSelection(foundPos).run();
      }
    } catch {
      // Comment mark not found in editor — sidebar highlight is sufficient
    }
  }, [editorInstance, setActiveCommentThread]);

  // Navigate to a document and optionally focus a comment
  const navigateToDocument = useCallback((documentId, commentId) => {
    if (!documentId) return;

    if (commentId) {
      pendingNavigationCommentIdRef.current = commentId;
    }

    // If already on this document, just focus the comment
    if (state.documentId === documentId) {
      if (commentId) {
        focusCommentById(commentId);
      }
      return;
    }

    // Switch to the target document — the useEffect below will handle the rest
    setDocumentId(documentId);
  }, [state.documentId, setDocumentId, focusCommentById]);

  // 1. Initialize & Fetch live MongoDB Atlas document
  useEffect(() => {
    let isMounted = true;
    const targetDocId = state.documentId || PRIMARY_LIVE_SEED_ID;

    setIsLoading(true);
    apiGetDocument(targetDocId)
      .then((doc) => {
        if (isMounted && doc) {
          setDocument(doc);
        }
      })
      .catch((err) => {
        console.warn('[DocSync Notice]: Loading fallback template document:', err.message);
        if (isMounted && !state.content) {
          setDocument(MOCK_INITIAL_DOCUMENT);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [state.documentId]);

  // Focus pending comment after document loads (from notification navigation)
  useEffect(() => {
    if (isReady && editorInstance && pendingNavigationCommentIdRef.current) {
      const commentId = pendingNavigationCommentIdRef.current;
      pendingNavigationCommentIdRef.current = null;
      // Small delay to ensure comment marks are hydrated
      const timer = setTimeout(() => focusCommentById(commentId), 300);
      return () => clearTimeout(timer);
    }
  }, [isReady, editorInstance, state.documentId, focusCommentById]);

  // 2. Autosave hook with offline queue and OCC 409 conflict detection
  const { status: saveStatus, lastSavedAt, error: saveError } = useAutosave({
    documentId: state.documentId || PRIMARY_LIVE_SEED_ID,
    content: state.content,
    plainText: state.plainText,
    currentVersion: state.version || 1,
    enabled: !state.isReadOnly,
    debounceMs: 1500,
    onConflictDetected: (conflictData) => {
      console.warn('[DocSync Conflict]: Server version is newer. Re-hydrating...');
      if (conflictData.serverDocument) {
        setDocument(conflictData.serverDocument);
      }
    },
  });

  // 3. Calculate live statistics
  const metrics = useMemo(() => {
    const text = state.plainText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    return {
      words: words || MOCK_INITIAL_DOCUMENT.wordCount,
      characters: characters || MOCK_INITIAL_DOCUMENT.characterCount,
    };
  }, [state.plainText]);

  // 4. Handle Global Slash Command Trigger
  useEffect(() => {
    if (!editorInstance) return;

    const handleKeyDown = (view, event) => {
      if (event.key === '/' && !state.isReadOnly) {
        const { from } = editorInstance.state.selection;
        const coords = editorInstance.view.coordsAtPos(from);
        setSlashMenu({
          isOpen: true,
          query: '',
          position: { top: coords.top, left: coords.left },
        });
      } else if (event.key === 'Escape') {
        setSlashMenu((prev) => ({ ...prev, isOpen: false }));
      }
      return false;
    };

    editorInstance.setOptions({
      editorProps: {
        handleKeyDown,
      },
    });
  }, [editorInstance, state.isReadOnly]);

  // 6. Hydrate persisted comment marks when comments load and editor is ready
  useEffect(() => {
    if (!editorInstance || !loadedComments || loadedComments.length === 0) return;

    try {
      const hydratedIds = hydratedCommentIdsRef.current;
      const fullText = editorInstance.getText();
      const doc = editorInstance.state.doc;

      for (const comment of loadedComments) {
        // Skip already-hydrated comments
        if (hydratedIds.has(comment._id)) continue;

        // Only hydrate top-level comments (replies don't need marks)
        if (comment.parentComment) continue;

        // Only hydrate text_selection anchors
        if (comment.anchorType !== 'text_selection') continue;

        // Skip comments without anchor data
        if (!comment.exactQuote) continue;

        // Resolve the anchor position against current document text
        const resolved = resolveAnchor({
          from: comment.from,
          to: comment.to,
          exactQuote: comment.exactQuote,
          prefixContext: comment.prefixContext || '',
          suffixContext: comment.suffixContext || '',
        });

        if (!resolved) {
          // Stale anchor — text was deleted or significantly altered. Skip gracefully.
          hydratedIds.add(comment._id);
          continue;
        }

        // Convert plain text offsets to ProseMirror positions for setTextSelection
        const pmFrom = plainTextOffsetToProseMirrorPos(doc, resolved.from);
        const pmTo = plainTextOffsetToProseMirrorPos(doc, resolved.to);

        // Apply the comment mark at the resolved position
        try {
          editorInstance
            .chain()
            .setTextSelection({ from: pmFrom, to: pmTo })
            .setMark('commentMark', { commentThreadId: comment._id, isActive: false })
            .run();
        } catch {
          // Mark application failed (e.g. selection out of range). Skip gracefully.
        }

        hydratedIds.add(comment._id);
      }
    } catch {
      // Hydration failed entirely — editor continues working without marks.
    }
  }, [editorInstance, loadedComments, resolveAnchor]);

  // 5. Global Keyboard Shortcuts Listener (Ctrl+/ for Help, F11 for Zen)
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'F11') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  // Jump to comment anchor in document
  const handleCommentClick = useCallback((comment) => {
    if (!comment || !editorInstance) return;

    // Update active comment thread in editor state
    setActiveCommentThread(comment._id);

    // Try to navigate using anchor data from the comment
    const targetQuote = comment.exactQuote;
    if (!targetQuote) return;

    const text = editorInstance.getText();
    const index = text.indexOf(targetQuote);
    if (index === -1) return;

    const doc = editorInstance.state.doc;
    const pmFrom = plainTextOffsetToProseMirrorPos(doc, index);
    const pmTo = plainTextOffsetToProseMirrorPos(doc, index + targetQuote.length);

    editorInstance
      .chain()
      .focus()
      .setTextSelection({ from: pmFrom, to: pmTo })
      .run();
  }, [editorInstance, setActiveCommentThread]);

  // Capture anchor data when creating a comment from editor selection.
  // This is a function (not a memoized value) so the selection is captured
  // at submission time, not at render time.
  const getAnchorPayload = useCallback(() => {
    return captureSelectionAnchor();
  }, [captureSelectionAnchor]);

  // Called after a top-level comment is successfully created
  const handleCommentCreated = useCallback((comment) => {
    if (comment && comment._id) {
      attachCommentMark(comment._id);
      hydratedCommentIdsRef.current.add(comment._id);
    }
  }, [attachCommentMark]);

  // Called when CommentsPanel finishes loading comments (for mark hydration)
  const handleCommentsLoaded = useCallback((comments) => {
    setLoadedComments(comments);
  }, []);

  // Handle Drag-and-Drop file ingestion
  const handleFileDrop = async (file) => {
    if (!file || !state.documentId) return;
    try {
      const fakeAttachment = {
        fileId: `file_${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        downloadUrl: '#',
      };
      await apiAddAttachment(state.documentId, fakeAttachment);
      addAttachment(fakeAttachment);
      executeCommand('setImage', { src: URL.createObjectURL(file) });
    } catch (err) {
      console.error('Failed to link file drop:', err);
    }
  };

  return (
    <DocumentNavigationProvider value={{ navigateToDocument, currentDocumentId: state.documentId }}>
    <div
      data-editor-container="true"
      className="flex flex-col min-h-screen bg-slate-100/75 text-slate-900 font-sans antialiased"
    >

      {/* 1. Top Global Navigation Header (Hidden in Zen Mode) */}
      {!isZenMode && <TopGlobalHeader onNavigateToDocument={navigateToDocument} />}

      {/* 2. Document Sub-Header & Breadcrumb Bar */}
      {!isZenMode && (
        <DocSubHeader
          documentTitle={state.title || MOCK_INITIAL_DOCUMENT.title}
          workspaceName={state.workspaceName || MOCK_INITIAL_DOCUMENT.workspaceName}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          onTitleChange={(newTitle) => updateTitle(newTitle)}
          onShareClick={() => alert('Workspace sharing modal opened: manage access and link permissions.')}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
      )}

      {/* 3. Main Workspace Area: Canvas + Floating Bars */}
      <div className="flex-1 flex w-full relative">
        {/* Left / Center Canvas Container */}
        <main className="flex-1 min-w-0 flex flex-col items-center px-4 sm:px-8 pb-16 overflow-y-auto pt-4">
          {/* Floating / Sticky Formatting Toolbar (Hidden in Zen Mode) */}
          {!isZenMode && (
            <div className="sticky top-2 z-30 mb-3 flex flex-col items-center gap-2">
              <FormattingToolbar

                onCommand={executeCommand}
                activeMarks={state.activeMarks}
                isReadOnly={state.isReadOnly}
              />
              {/* Contextual Table Popover Menu */}
              {editorInstance && editorInstance.isActive('table') && (
                <TableCellMenu editor={editorInstance} />
              )}
            </div>
          )}

          {/* Centered Paper Document Sheet */}
          <PaperDocumentSheet
            editorRef={editorRef}
            isReady={isReady && !isLoading}
            isReadOnly={state.isReadOnly}
            onFileDrop={handleFileDrop}
          />

          {/* Floating Contextual Bubble Menu */}
          {editorInstance && (
            <div className="fixed bottom-16 z-40">
              <BubbleFloatingMenu
                editor={editorInstance}
                onAddComment={() => executeCommand('insertComment')}
              />
            </div>
          )}

          {/* Slash Command Palette Popover */}
          <SlashCommandMenu
            editor={editorInstance}
            isOpen={slashMenu.isOpen}
            query={slashMenu.query}
            position={slashMenu.position}
            onClose={() => setSlashMenu((prev) => ({ ...prev, isOpen: false }))}
          />
        </main>

        {/* Right Collapsible Collaboration & History Sidebar (Hidden in Zen Mode) */}
        {!isZenMode && (
          <div className="w-88 flex-shrink-0 flex flex-col border-l border-slate-200 bg-white sticky top-12 h-[calc(100vh-48px)] overflow-hidden select-none">
            <CommentsPanel
              documentId={state.documentId}
              createAnchorPayload={getAnchorPayload}
              onCommentCreated={handleCommentCreated}
              onCommentClick={handleCommentClick}
              activeCommentThreadId={activeCommentThreadId}
              onCommentsLoaded={handleCommentsLoaded}
            />
          </div>
        )}
      </div>

      {/* 4. Bottom Fixed Status Bar (Hidden in Zen Mode) */}
      {!isZenMode && (
        <BottomStatusBar
          wordCount={metrics.words}
          characterCount={metrics.characters}
          lastEditedBy={MOCK_INITIAL_DOCUMENT.lastEditedBy}
          lastEditedAt={MOCK_INITIAL_DOCUMENT.lastEditedAt}
          folderLocation={MOCK_INITIAL_DOCUMENT.folderName}
        />
      )}

      {/* 5. Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
    </DocumentNavigationProvider>
  );
}

/**
 * Public Root EditorCanvas component wrapping DocumentEditorProvider.
 */
export function EditorCanvas({
  documentId = PRIMARY_LIVE_SEED_ID,
  initialReadOnly = false,
  onDocumentArchived,
  onDocumentDuplicated,
}) {
  return (
    <DocumentEditorProvider initialDocumentId={documentId} initialReadOnly={initialReadOnly}>
      <EditorCanvasInner
        onDocumentArchived={onDocumentArchived}
        onDocumentDuplicated={onDocumentDuplicated}
      />
    </DocumentEditorProvider>
  );
}

export default EditorCanvas;

