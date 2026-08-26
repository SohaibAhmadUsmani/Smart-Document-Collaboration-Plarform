import React, { useEffect, useState, useMemo } from 'react';
import { DocumentEditorProvider, useDocumentEditorContext } from '../context/DocumentEditorContext.jsx';
import { useDocumentEditor } from '../hooks/useDocumentEditor.js';
import { useTipTapEditor } from '../hooks/useTipTapEditor.js';
import { useAutosave } from '../hooks/useAutosave.js';
import { TopGlobalHeader } from './TopGlobalHeader.jsx';
import { DocSubHeader } from './DocSubHeader.jsx';
import { FormattingToolbar } from './FormattingToolbar.jsx';
import { PaperDocumentSheet } from './PaperDocumentSheet.jsx';
import { CollaborationSidebar } from './CollaborationSidebar.jsx';
import { BottomStatusBar } from './BottomStatusBar.jsx';
import { apiGetDocument } from '../services/documentApi.js';
import { MOCK_INITIAL_DOCUMENT } from '../services/mockData.js';

function EditorCanvasInner({ onDocumentArchived, onDocumentDuplicated }) {
  const { state, setDocument, updateTitle } = useDocumentEditor();
  const { editorRef, isReady, executeCommand, editorInstance } = useTipTapEditor({
    initialContent: state.content || MOCK_INITIAL_DOCUMENT.content,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Initialize document data (from API if id exists, or fallback to mock)
  useEffect(() => {
    let isMounted = true;

    if (state.documentId && state.documentId !== MOCK_INITIAL_DOCUMENT.id) {
      setIsLoading(true);
      apiGetDocument(state.documentId)
        .then((doc) => {
          if (isMounted && doc) setDocument(doc);
        })
        .catch((err) => {
          console.warn('[DocSync Notice]: Loading template document:', err.message);
          if (isMounted) setDocument(MOCK_INITIAL_DOCUMENT);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else if (!state.content) {
      // Hydrate with initial template if content is unpopulated
      setDocument(MOCK_INITIAL_DOCUMENT);
    }

    return () => {
      isMounted = false;
    };
  }, [state.documentId, state.content]);

  // Autosave hook
  const { status: saveStatus, lastSavedAt } = useAutosave({
    documentId: state.documentId || MOCK_INITIAL_DOCUMENT.id,
    content: state.content,
    plainText: state.plainText,
    enabled: !state.isReadOnly,
    debounceMs: 1500,
  });

  // Calculate live statistics
  const metrics = useMemo(() => {
    const text = state.plainText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    return {
      words: words || MOCK_INITIAL_DOCUMENT.wordCount,
      characters: characters || MOCK_INITIAL_DOCUMENT.characterCount,
    };
  }, [state.plainText]);

  // Jump to comment anchor in document
  const handleCommentClick = (comment) => {
    if (!comment || !editorInstance) return;
    const targetQuote = comment.anchor?.exactQuote;
    if (targetQuote) {
      const text = editorInstance.getText();
      const index = text.indexOf(targetQuote);
      if (index !== -1) {
        editorInstance.commands.setTextSelection({
          from: index + 1,
          to: index + 1 + targetQuote.length,
        });
      }
    }
  };

  return (
    <div
      data-editor-container="true"
      className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans antialiased"
    >
      {/* 1. Top Global Navigation Header */}
      <TopGlobalHeader />

      {/* 2. Document Sub-Header & Action Breadcrumb Bar */}
      <DocSubHeader
        documentTitle={state.title || MOCK_INITIAL_DOCUMENT.title}
        workspaceName={state.workspaceName || MOCK_INITIAL_DOCUMENT.workspaceName}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onTitleChange={(newTitle) => updateTitle(newTitle)}
        onShareClick={() => alert('Workspace sharing modal opened: manage access and link permissions.')}
      />

      {/* 3. Main Workspace Area: Canvas + Formatting Toolbar + Collaboration Sidebar */}
      <div className="flex-1 flex w-full relative">
        {/* Left / Center Canvas Container */}
        <main className="flex-1 min-w-0 flex flex-col items-center px-4 sm:px-8 pb-16 overflow-y-auto">
          {/* Floating / Sticky Formatting Toolbar */}
          <FormattingToolbar
            onCommand={executeCommand}
            activeMarks={state.activeMarks}
            isReadOnly={state.isReadOnly}
          />

          {/* Centered Paper Document Sheet */}
          <PaperDocumentSheet
            editorRef={editorRef}
            isReady={isReady && !isLoading}
            isReadOnly={state.isReadOnly}
          />
        </main>

        {/* Right Collapsible Collaboration & History Sidebar */}
        <CollaborationSidebar
          activeThreadId={state.activeCommentThreadId}
          onResolveComment={(id) => console.log('Comment resolved:', id)}
          onAddComment={(cmt) => console.log('Comment added:', cmt)}
          onCommentClick={handleCommentClick}
        />
      </div>

      {/* 4. Bottom Fixed Status Bar */}
      <BottomStatusBar
        wordCount={metrics.words}
        characterCount={metrics.characters}
        lastEditedBy={MOCK_INITIAL_DOCUMENT.lastEditedBy}
        lastEditedAt={MOCK_INITIAL_DOCUMENT.lastEditedAt}
        folderLocation={MOCK_INITIAL_DOCUMENT.folderName}
      />
    </div>
  );
}

/**
 * Public Root EditorCanvas component wrapping DocumentEditorProvider.
 */
export function EditorCanvas({
  documentId = null,
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
