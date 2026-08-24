import React, { useEffect, useState } from 'react';
import { DocumentEditorProvider, useDocumentEditorContext } from '../context/DocumentEditorContext.jsx';
import { useDocumentEditor } from '../hooks/useDocumentEditor.js';
import { useTipTapEditor } from '../hooks/useTipTapEditor.js';
import { useAutosave } from '../hooks/useAutosave.js';
import { EditorHeader } from './EditorHeader.jsx';
import { EditorToolbar } from './EditorToolbar.jsx';
import { TagFavoriteBar } from './TagFavoriteBar.jsx';
import { DocumentStats } from './DocumentStats.jsx';
import { DocumentOutline } from './DocumentOutline.jsx';
import { apiGetDocument, apiUpdateDocumentMetadata } from '../services/documentApi.js';

function EditorCanvasInner({ onDocumentArchived, onDocumentDuplicated }) {
  const { state, setDocument, updateTitle, setIsReadOnly } = useDocumentEditor();
  const { editorRef, isReady, executeCommand } = useTipTapEditor();
  const [isLoading, setIsLoading] = useState(Boolean(state.documentId));
  const [loadError, setLoadError] = useState(null);
  const [showOutline, setShowOutline] = useState(false);

  // Load document data from backend API
  useEffect(() => {
    if (!state.documentId) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    apiGetDocument(state.documentId)
      .then((doc) => {
        if (isMounted && doc) {
          setDocument(doc);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err.message || 'Failed to load document');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [state.documentId]);

  // Hook for autosaving document content changes
  const { status: saveStatus, lastSavedAt } = useAutosave({
    documentId: state.documentId,
    content: state.content,
    plainText: state.plainText,
    enabled: !state.isReadOnly && Boolean(state.documentId),
    debounceMs: 1500,
  });

  const handleTitleChange = async (newTitle) => {
    updateTitle(newTitle);
    if (state.documentId && !state.isReadOnly) {
      try {
        await apiUpdateDocumentMetadata(state.documentId, { title: newTitle });
      } catch (err) {
        console.error('[Title Update Error]:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm text-slate-500 animate-pulse">Loading document...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h3 className="text-base font-semibold text-red-600 mb-1">Error Loading Document</h3>
        <p className="text-sm text-slate-500 mb-4">{loadError}</p>
      </div>
    );
  }

  return (
    <div
      data-editor-container="true"
      className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950"
    >
      {/* Top Header with title, autosave status, and actions */}
      <EditorHeader
        documentId={state.documentId}
        title={state.title}
        onTitleChange={handleTitleChange}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        isReadOnly={state.isReadOnly}
        onReadOnlyToggle={setIsReadOnly}
        onDocumentDuplicated={onDocumentDuplicated}
        onDocumentArchived={onDocumentArchived}
      />

      {/* Tags and Starred Favorites bar */}
      <TagFavoriteBar isReadOnly={state.isReadOnly} />

      {/* Rich formatting toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <EditorToolbar
          onCommand={executeCommand}
          activeMarks={state.activeMarks}
          isReadOnly={state.isReadOnly}
        />
        <button
          type="button"
          onClick={() => setShowOutline((prev) => !prev)}
          className={`px-3 py-1.5 text-xs font-medium mr-2 rounded transition-colors ${
            showOutline
              ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle Table of Contents Outline"
        >
          Outline
        </button>
      </div>

      {/* Main Canvas & Outline Sidebar Layout */}
      <div className="flex flex-1 max-w-6xl w-full mx-auto px-6 py-6 gap-6">
        {/* Main document canvas */}
        <main className="flex-1 min-w-0">
          <div className="min-h-[70vh] bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-8">
            <article
              data-editor-canvas="true"
              data-readonly={state.isReadOnly ? 'true' : 'false'}
              data-save-status={state.saveStatus}
              className="prose dark:prose-invert max-w-none focus:outline-none min-h-[500px]"
            >
              <div ref={editorRef} data-editor-surface="true" tabIndex={0} />
            </article>
          </div>
        </main>

        {/* Outline Sidebar Drawer */}
        {showOutline && (
          <aside className="w-64 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-4 h-fit sticky top-20">
            <DocumentOutline />
          </aside>
        )}
      </div>

      {/* Live metrics footer */}
      <DocumentStats plainText={state.plainText} />
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
