/**
 * @file EditorActions.jsx
 * @description Action menu dropdown component for document operations.
 * Handles duplicate, exports (Markdown, JSON, Plain Text), archive to trash, and read-only toggle.
 * @module frontend/src/modules/editor/components/EditorActions
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh component document ke action dropdown menu ko render karta hai jisme duplicate,
 * markdown/JSON/text export, trash mein bhejna (soft-delete), aur read-only mode toggle shamil hain.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  Copy,
  Download,
  Trash2,
  Eye,
  EyeOff,
  FileCode,
  FileText,
} from 'lucide-react';
import { apiDuplicateDocument, apiArchiveDocument, apiExportDocument } from '../services/documentApi.js';

/**
 * Document editor action menu.
 *
 * [ROMAN URDU]:
 * Dropdown actions menu component.
 *
 * @param {Object} props
 * @param {string} props.documentId - Target document ID
 * @param {boolean} [props.isReadOnly=false] - If document is in read-only mode
 * @param {Function} [props.onReadOnlyToggle] - Callback to toggle read-only mode
 * @param {Function} [props.onDocumentDuplicated] - Callback when cloned
 * @param {Function} [props.onDocumentArchived] - Callback when archived
 * @returns {React.JSX.Element}
 */
export function EditorActions({
  documentId,
  isReadOnly = false,
  onReadOnlyToggle,
  onDocumentDuplicated,
  onDocumentArchived,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExportSubmenuOpen, setIsExportSubmenuOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsExportSubmenuOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDuplicate = async () => {
    if (!documentId || isBusy) return;
    try {
      setIsBusy(true);
      const duplicated = await apiDuplicateDocument(documentId);
      setIsOpen(false);
      onDocumentDuplicated?.(duplicated);
    } catch (err) {
      console.error('[Duplicate Error]:', err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleArchive = async () => {
    if (!documentId || isBusy) return;
    const confirm = window.confirm('Move this document to trash? It will be retained for 30 days.');
    if (!confirm) return;

    try {
      setIsBusy(true);
      await apiArchiveDocument(documentId);
      setIsOpen(false);
      onDocumentArchived?.(documentId);
    } catch (err) {
      console.error('[Archive Error]:', err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleExport = async (format) => {
    if (!documentId || isBusy) return;
    try {
      setIsBusy(true);
      const result = await apiExportDocument(documentId, format);
      if (result?.content) {
        const blob = new Blob([result.content], { type: result.mimeType || 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `document.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setIsOpen(false);
      setIsExportSubmenuOpen(false);
    } catch (err) {
      console.error('[Export Error]:', err);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
        title="Document Actions"
        aria-label="Document Actions"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={onReadOnlyToggle}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            {isReadOnly ? <Eye className="w-4 h-4 text-slate-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
            <span>{isReadOnly ? 'Switch to Edit Mode' : 'Switch to Read-Only'}</span>
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={handleDuplicate}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-50"
          >
            <Copy className="w-4 h-4 text-slate-400" />
            <span>Duplicate Document</span>
          </button>

          <div
            className="relative"
            onMouseEnter={() => setIsExportSubmenuOpen(true)}
            onMouseLeave={() => setIsExportSubmenuOpen(false)}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-slate-400" />
                <span>Export As...</span>
              </div>
              <span className="text-slate-400 text-[10px]">▶</span>
            </button>

            {isExportSubmenuOpen && (
              <div className="absolute right-full top-0 mr-1 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50">
                <button
                  type="button"
                  onClick={() => handleExport('markdown')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Markdown (.md)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-500" />
                  <span>JSON AST (.json)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('text')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Plain Text (.txt)</span>
                </button>
              </div>
            )}
          </div>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <button
            type="button"
            disabled={isBusy}
            onClick={handleArchive}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Move to Trash</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default EditorActions;
