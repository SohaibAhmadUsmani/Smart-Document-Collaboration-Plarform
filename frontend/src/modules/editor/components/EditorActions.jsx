import React, { useState } from 'react';
import { apiExportDocument, apiDuplicateDocument, apiArchiveDocument } from '../services/documentApi.js';

/**
 * Editor Actions component providing document workflow triggers:
 * Duplicate, Export (Markdown, JSON, Text), Read-Only Toggle, and Archive.
 *
 * @param {Object} props
 * @param {string} props.documentId
 * @param {boolean} [props.isReadOnly=false]
 * @param {Function} [props.onReadOnlyToggle]
 * @param {Function} [props.onDocumentDuplicated]
 * @param {Function} [props.onDocumentArchived]
 */
export function EditorActions({
  documentId,
  isReadOnly = false,
  onReadOnlyToggle,
  onDocumentDuplicated,
  onDocumentArchived,
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = async (format) => {
    if (!documentId || isExporting) return;
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      await apiExportDocument(documentId, format);
    } catch (err) {
      console.error('[Export Error]:', err);
      alert('Failed to export document: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!documentId || isDuplicating) return;
    try {
      setIsDuplicating(true);
      const cloned = await apiDuplicateDocument(documentId);
      onDocumentDuplicated?.(cloned);
    } catch (err) {
      console.error('[Duplicate Error]:', err);
      alert('Failed to duplicate document: ' + err.message);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleArchive = async () => {
    if (!documentId || isArchiving) return;
    if (!window.confirm('Are you sure you want to move this document to trash?')) return;

    try {
      setIsArchiving(true);
      await apiArchiveDocument(documentId);
      onDocumentArchived?.(documentId);
    } catch (err) {
      console.error('[Archive Error]:', err);
      alert('Failed to archive document: ' + err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Read-Only Toggle */}
      <button
        type="button"
        onClick={() => onReadOnlyToggle?.(!isReadOnly)}
        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
          isReadOnly
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title={isReadOnly ? 'Switch to Edit mode' : 'Switch to Read-only mode'}
      >
        {isReadOnly ? '👁 Viewing' : '✎ Editing'}
      </button>

      {/* Duplicate Button */}
      <button
        type="button"
        disabled={!documentId || isDuplicating}
        onClick={handleDuplicate}
        className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
        title="Duplicate this document"
      >
        {isDuplicating ? 'Duplicating...' : 'Duplicate'}
      </button>

      {/* Export Dropdown */}
      <div className="relative">
        <button
          type="button"
          disabled={!documentId || isExporting}
          onClick={() => setShowExportMenu((prev) => !prev)}
          className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          <span className="text-[10px]">▼</span>
        </button>

        {showExportMenu && (
          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg py-1 z-20">
            <button
              type="button"
              onClick={() => handleExport('markdown')}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Markdown (.md)
            </button>
            <button
              type="button"
              onClick={() => handleExport('json')}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              JSON (.json)
            </button>
            <button
              type="button"
              onClick={() => handleExport('text')}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Plain Text (.txt)
            </button>
          </div>
        )}
      </div>

      {/* Archive / Trash */}
      <button
        type="button"
        disabled={!documentId || isArchiving}
        onClick={handleArchive}
        className="px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors disabled:opacity-50"
        title="Move document to trash"
      >
        {isArchiving ? 'Archiving...' : 'Archive'}
      </button>
    </div>
  );
}
