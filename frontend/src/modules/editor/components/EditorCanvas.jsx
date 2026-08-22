import React, { useState, useEffect } from 'react';
import { EditorHeader } from './EditorHeader.jsx';
import { useAutosave } from '../hooks/useAutosave.js';
import { apiGetDocument, apiUpdateDocumentMetadata } from '../services/documentApi.js';
import { DEFAULT_DOCUMENT_AST } from '../types/document.js';

/**
 * Main container component for the Document Editor.
 *
 * @param {Object} props
 * @param {string} props.documentId - Document ID to load and edit
 * @param {boolean} [props.isReadOnly=false] - Whether editing is disabled
 */
export function EditorCanvas({ documentId, isReadOnly = false }) {
  const [documentData, setDocumentData] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(DEFAULT_DOCUMENT_AST);
  const [isLoading, setIsLoading] = useState(Boolean(documentId));
  const [loadError, setLoadError] = useState(null);

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
      <EditorHeader
        title={title}
        onTitleChange={handleTitleChange}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        isReadOnly={isReadOnly}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-8 py-10">
        {/* The rich-text editor surface (TipTap / Slate) mounts here */}
        <div className="min-h-[70vh] bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          {/* Editor content placeholder/slot */}
          <div className="prose dark:prose-invert max-w-none">
            {/* Rich text node tree rendered here by chosen editor engine */}
          </div>
        </div>
      </main>
    </div>
  );
}
