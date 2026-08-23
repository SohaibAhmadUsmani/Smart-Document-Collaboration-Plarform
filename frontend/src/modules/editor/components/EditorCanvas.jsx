import React, { useState, useEffect, useMemo } from 'react';
import { EditorHeader } from './EditorHeader.jsx';
import { EditorToolbar } from './EditorToolbar.jsx';
import { DocumentStats } from './DocumentStats.jsx';
import { useAutosave } from '../hooks/useAutosave.js';
import { apiGetDocument, apiUpdateDocumentMetadata } from '../services/documentApi.js';
import { DEFAULT_DOCUMENT_AST } from '../types/document.js';

/**
 * Main container component for the Document Editor.
 * Manages document loading, editing state, toolbar triggers, autosaving, and statistics.
 *
 * @param {Object} props
 * @param {string} props.documentId - Document ID to load and edit
 * @param {boolean} [props.initialReadOnly=false] - Initial read-only flag
 * @param {Function} [props.onDocumentArchived] - Callback when document is moved to trash
 * @param {Function} [props.onDocumentDuplicated] - Callback when document is duplicated
 */
export function EditorCanvas({
  documentId,
  initialReadOnly = false,
  onDocumentArchived,
  onDocumentDuplicated,
}) {
  const [documentData, setDocumentData] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(DEFAULT_DOCUMENT_AST);
  const [plainText, setPlainText] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(initialReadOnly);
  const [isLoading, setIsLoading] = useState(Boolean(documentId));
  const [loadError, setLoadError] = useState(null);
  const [activeMarks, setActiveMarks] = useState({});

  // Load document data from backend API
  useEffect(() => {
    if (!documentId) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    apiGetDocument(documentId)
      .then((doc) => {
        if (isMounted && doc) {
          setDocumentData(doc);
          setTitle(doc.title || 'Untitled Document');
          setContent(doc.content || DEFAULT_DOCUMENT_AST);
          setPlainText(doc.plainText || '');
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
  }, [documentId]);

  // Hook for autosaving document content changes
  const { status: saveStatus, lastSavedAt, error: saveError } = useAutosave({
    documentId,
    content,
    plainText,
    enabled: !isReadOnly && Boolean(documentId),
    debounceMs: 1500,
  });

  // Handle title updates with backend sync
  const handleTitleChange = async (newTitle) => {
    setTitle(newTitle);
    if (documentId && !isReadOnly) {
      try {
        await apiUpdateDocumentMetadata(documentId, { title: newTitle });
      } catch (err) {
        console.error('[Title Update Error]:', err);
      }
    }
  };

  // Handle toolbar command triggers
  const handleToolbarCommand = (command, payload) => {
    if (isReadOnly) return;

    // Toggle active mark state for UI feedback
    setActiveMarks((prev) => ({
      ...prev,
      [command]: !prev[command],
    }));

    // Dispatches command to the active editor engine (TipTap / Slate)
    console.log(`[Editor Command]: ${command}`, payload);
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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Header with title, autosave status, and actions */}
      <EditorHeader
        documentId={documentId}
        title={title}
        onTitleChange={handleTitleChange}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        isReadOnly={isReadOnly}
        onReadOnlyToggle={setIsReadOnly}
        onDocumentDuplicated={onDocumentDuplicated}
        onDocumentArchived={onDocumentArchived}
      />

      {/* Rich formatting toolbar */}
      <EditorToolbar
        onCommand={handleToolbarCommand}
        activeMarks={activeMarks}
        isReadOnly={isReadOnly}
      />

      {/* Main document canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        <div className="min-h-[70vh] bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          {/* Editable rich-text surface placeholder for TipTap/Slate */}
          <div className="prose dark:prose-invert max-w-none focus:outline-none min-h-[500px]">
            {/* Rich text node tree rendered here */}
          </div>
        </div>
      </main>

      {/* Live metrics footer */}
      <DocumentStats plainText={plainText} />
    </div>
  );
}
