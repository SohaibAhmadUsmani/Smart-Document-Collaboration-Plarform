/**
 * @file PaperDocumentSheet.jsx
 * @description Elevated tactile paper document canvas surface with responsive fluid padding,
 * drag-and-drop file ingestion, automatic blob memory cleanup, and mount guard.
 * @module frontend/src/modules/editor/components/PaperDocumentSheet
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh component document ke main "paper page" ko render karta hai. Isme fluid responsive padding
 * di gayi hai taake mobile screen par text dab na jaye. Drag & Drop ke waqt banaye gaye blob
 * URLs unmount par clean kiye jaate hain, aur React StrictMode double hydration se bachne ke
 * liye pristine mount guard implement kiya gaya hai.
 */

import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

/**
 * PaperDocumentSheet Component (DocSync Pro Sheet).
 *
 * [ROMAN URDU]:
 * Paper canvas surface jo dropzone overlay, skeleton placeholder, aur TipTap surface render karti hai.
 *
 * @param {Object} props
 * @param {React.RefObject} props.editorRef - Ref for the TipTap ProseMirror contenteditable container
 * @param {Object} [props.editorInstance=null] - TipTap Editor instance
 * @param {boolean} [props.isReady=true] - Whether the editor instance is fully initialized
 * @param {boolean} [props.isReadOnly=false] - Whether editing is disabled
 * @param {Function} [props.onFileDrop] - Callback when a file is dropped onto the sheet
 * @returns {React.JSX.Element}
 */
export function PaperDocumentSheet({
  editorRef,
  editorInstance = null,
  isReady = true,
  isReadOnly = false,
  onFileDrop,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Track generated blob preview URLs for garbage collection
  const blobUrlsRef = useRef(new Set());

  // Pristine mount guard to prevent double-hydration dirty state in React StrictMode
  const isPristineRef = useRef(true);

  useEffect(() => {
    isPristineRef.current = true;
    const timer = setTimeout(() => {
      isPristineRef.current = false;
    }, 150);

    const currentBlobs = blobUrlsRef.current;
    return () => {
      clearTimeout(timer);
      // Revoke all registered object URLs to prevent browser memory leaks
      currentBlobs.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (err) {
          console.warn('[PaperDocumentSheet]: Could not revoke blob URL:', err);
        }
      });
      currentBlobs.clear();
    };
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isReadOnly) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isReadOnly) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0 && onFileDrop) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        blobUrlsRef.current.add(previewUrl);
        onFileDrop(file, previewUrl);
      } else {
        onFileDrop(file);
      }
    }
  };

  const handleSurfaceClick = (e) => {
    if (isReadOnly) return;
    if (editorInstance) {
      if (!editorInstance.isFocused) {
        editorInstance.chain().focus('end').run();
      }
    } else if (editorRef?.current) {
      const pm = editorRef.current.querySelector('.ProseMirror');
      if (pm && document.activeElement !== pm) {
        pm.focus();
      }
    }
  };

  return (
    <div
      role="region"
      aria-label="Document Page Canvas"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleSurfaceClick}
      className={`relative w-full max-w-[880px] min-h-[1100px] cursor-text bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 px-4 sm:px-10 md:px-16 lg:px-20 py-8 sm:py-12 mb-16 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4),0_1px_3px_rgba(0,0,0,0.3)] ${
        isDragOver
          ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-2xl bg-blue-50/20 dark:bg-blue-950/20'
          : 'border-slate-200/90 dark:border-slate-800'
      }`}
    >
      {/* Animated Dropzone Overlay with WCAG-compliant backdrop */}
      {isDragOver && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-4 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/90 dark:bg-blue-950/90 backdrop-blur-xs flex flex-col items-center justify-center z-30 pointer-events-none animate-in fade-in duration-150"
        >
          <div className="p-3 bg-blue-600 text-white rounded-full shadow-lg mb-2">
            <UploadCloud className="w-8 h-8" />
          </div>
          <span className="text-sm font-bold text-blue-900 dark:text-blue-100">Drop file to attach</span>
          <span className="text-xs text-blue-600 dark:text-blue-300">PDF, DOCX, XLSX, PNG, JPG</span>
        </div>
      )}

      {/* Skeleton placeholder while editor initializes */}
      {!isReady && (
        <div className="animate-pulse space-y-4 py-8" aria-hidden="true">
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4 mb-6"></div>
          <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
          <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
          <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2 mt-8 mb-4"></div>
          <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
        </div>
      )}

      {/* TipTap prose mirror contenteditable mount article */}
      <article
        data-editor-canvas="true"
        data-readonly={isReadOnly ? 'true' : 'false'}
        onClick={handleSurfaceClick}
        className="max-w-none focus:outline-none min-h-[700px] cursor-text print:p-0"
      >
        <div
          ref={editorRef}
          data-editor-surface="true"
          aria-label="Editable document text surface"
          className="outline-none min-h-[700px] cursor-text"
        />
      </article>
    </div>
  );
}

export default PaperDocumentSheet;
