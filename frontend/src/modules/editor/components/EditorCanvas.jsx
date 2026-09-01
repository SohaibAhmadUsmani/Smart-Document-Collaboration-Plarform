import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { DocumentEditorProvider, useDocumentEditorContext } from '../context/DocumentEditorContext.jsx';
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

import { CollaborationProvider } from '../../collaboration/context/CollaborationContext.jsx';
import { useDocumentCollaboration } from '../../collaboration/hooks/useDocumentCollaboration.js';
import { usePresencePosition } from '../../collaboration/hooks/usePresencePosition.js';
import { getCurrentUserId } from '../../collaboration/services/socketClient.js';
import { ActiveUsers } from '../../collaboration/components/ActiveUsers.jsx';
import { ConflictResolutionModal } from './ConflictResolutionModal.jsx';
import { apiGetDocument, apiAddAttachment, apiCreateDocument } from '../services/documentApi.js';
import { MOCK_INITIAL_DOCUMENT } from '../services/mockData.js';
import { SAVE_STATUS } from '../types/document.js';

const PRIMARY_LIVE_SEED_ID = '66cc00000000000000000001';

/**
 * EditorCanvasInner Component (DocSync Pro Primary Workspace Canvas)
 *
 * Coordinates live document state, autosaving, TipTap ProseMirror lifecycle,
 * floating toolbars, contextual popovers, OCC 409 conflict modal, and responsive canvas layout.
 *
 * [ROMAN URDU]:
 * Main editor orchestration container jo state, TipTap instance, autosave,
 * 409 version conflict modal, headers, toolbars, aur sidebar ko aapas mein bind karta hai.
 */
function EditorCanvasInner({ onDocumentArchived, onDocumentDuplicated }) {
  const {
    state,
    setDocument,
    updateTitle,
    addAttachment,
    setConflict,
    resolveConflict,
    setActiveCommentThread,
  } = useDocumentEditor();
  const { editorRef, isReady, executeCommand, editorInstance } = useTipTapEditor({
    initialContent: state.content || MOCK_INITIAL_DOCUMENT.content,
  });

  // Real-time collaboration: mirror this document's content over Socket.IO.
  // Persistence remains with the existing autosave hook below.
  const collaborationDocId = state.documentId || PRIMARY_LIVE_SEED_ID;
  const {
    activeUsers,
    presenceCount,
    connected: collabConnected,
  } = useDocumentCollaboration({
    documentId: collaborationDocId,
    editor: editorInstance,
    content: state.content,
    plainText: state.plainText,
  });

  // Real-time cursor & selection presence (remote carets + highlighted ranges).
  const currentUserId = getCurrentUserId();
  usePresencePosition({
    documentId: collaborationDocId,
    editor: editorInstance,
    userId: currentUserId,
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

  // 2. Autosave hook with bounded offline queue and OCC 409 conflict detection
  // [Issue #14]: Trigger interactive conflict resolution modal instead of silently dropping user changes
  const { status: saveStatus, lastSavedAt, error: saveError, saveNow } = useAutosave({
    documentId: state.documentId || PRIMARY_LIVE_SEED_ID,
    content: state.content,
    plainText: state.plainText,
    currentVersion: state.version || 1,
    enabled: !state.isReadOnly,
    debounceMs: 1500,
    onConflictDetected: (conflictData) => {
      console.warn('[DocSync Conflict]: Server version mismatch (409 Conflict). Opening resolution dialog...');
      setConflict(conflictData);
    },
    onCrossTabSync: (syncData) => {
      console.log('[DocSync Cross-Tab Sync Notice]:', syncData);
    },
  });

  // 3. Handle conflict resolution action
  const handleResolveConflict = (resolutionPayload) => {
    resolveConflict(resolutionPayload);
    // If user chose to overwrite with local edits or merge, force save
    if (resolutionPayload.resolution === 'keep_local' || resolutionPayload.resolution === 'merge') {
      setTimeout(() => {
        saveNow();
      }, 150);
    }
  };

  // 4. Calculate live statistics
  const metrics = useMemo(() => {
    const text = state.plainText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    return {
      words: words || MOCK_INITIAL_DOCUMENT.wordCount,
      characters: characters || MOCK_INITIAL_DOCUMENT.characterCount,
    };
  }, [state.plainText]);

  // 5. Handle Global Slash Command Trigger
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

  // 7. Global Keyboard Shortcuts Listener (Ctrl+/ for Help, F11 for Zen)
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

  // [Issue #46]: Handle Drag-and-Drop file ingestion with preview URL support
  const handleFileDrop = async (file, previewUrl) => {
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
      const urlToUse = previewUrl || (file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
      if (urlToUse) {
        executeCommand('setImage', { src: urlToUse });
      }
    } catch (err) {
      console.error('Failed to link file drop:', err);
    }
  };

  return (
    <div
      data-editor-container="true"
      className="flex flex-col min-h-screen bg-slate-100/75 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased"
    >
      {/* 1. Top Global Navigation Header (Hidden in Zen Mode) */}
      {!isZenMode && <TopGlobalHeader />}

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
        <main className="flex-1 min-w-0 flex flex-col items-center px-2 sm:px-6 md:px-8 pb-16 overflow-y-auto pt-2 sm:pt-4">
          {/* Floating / Sticky Formatting Toolbar (Hidden in Zen Mode) */}
          {!isZenMode && (
            <div className="sticky top-2 z-30 mb-3 flex flex-col items-center gap-2 max-w-full">
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

          {/* Real-time presence indicator (collaboration module) */}
          {!isZenMode && (
            <div className="fixed right-24 top-16 z-30 hidden sm:flex">
              <ActiveUsers
                users={activeUsers}
                count={presenceCount}
                connected={collabConnected}
              />
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

      {/* 6. Version Conflict Resolution Modal (HTTP 409 OCC) */}
      <ConflictResolutionModal
        isOpen={Boolean(state.conflictData)}
        localContent={state.conflictData?.localContent}
        localPlainText={state.conflictData?.localPlainText || state.plainText}
        serverDocument={state.conflictData?.serverDocument}
        onKeepLocal={() =>
          handleResolveConflict({
            resolution: 'keep_local',
            serverDocument: state.conflictData?.serverDocument,
          })
        }
        onDiscardAndLoadServer={() =>
          handleResolveConflict({
            resolution: 'keep_server',
            serverDocument: state.conflictData?.serverDocument,
          })
        }
        onSaveLocalCopy={async () => {
          if (state.conflictData?.localContent) {
            try {
              const newDoc = await apiCreateDocument({
                title: `${state.title || 'Untitled'} (Local Copy)`,
                content: state.conflictData.localContent,
                plainText: state.conflictData.localPlainText || state.plainText,
                workspaceId: state.workspaceId,
              });
              handleResolveConflict({
                resolution: 'keep_server',
                serverDocument: state.conflictData?.serverDocument,
              });
              alert(`Local copy saved as new document: "${newDoc.title || 'Untitled'}"`);
            } catch (err) {
              console.error('Failed to create local copy:', err);
            }
          }
        }}
        onClose={() => setConflict(null)}
      />
    </div>
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
      {/* CollaborationProvider supplies the shared Socket.IO connection used by
          useDocumentCollaboration for real-time editing/presence. */}
      <CollaborationProvider>
        <EditorCanvasInner
          onDocumentArchived={onDocumentArchived}
          onDocumentDuplicated={onDocumentDuplicated}
        />
      </CollaborationProvider>
    </DocumentEditorProvider>
  );
}

export default EditorCanvas;
