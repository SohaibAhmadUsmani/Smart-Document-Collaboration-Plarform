import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';

export function PaperDocumentSheet({
  editorRef,
  isReady = true,
  isReadOnly = false,
  onFileDrop,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

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
      onFileDrop(files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full max-w-[880px] min-h-[1100px] bg-white rounded-2xl border transition-all duration-300 p-12 sm:p-20 mb-16 ${
        isDragOver
          ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-2xl bg-blue-50/20'
          : 'border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.04),0_10px_25px_-5px_rgba(15,23,42,0.06),0_20px_40px_-15px_rgba(15,23,42,0.08)]'
      }`}
    >
      {/* Animated Dropzone Overlay */}
      {isDragOver && (
        <div className="absolute inset-4 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/90 backdrop-blur-xs flex flex-col items-center justify-center z-30 pointer-events-none animate-in fade-in duration-150">
          <div className="p-3 bg-blue-600 text-white rounded-full shadow-lg mb-2">
            <UploadCloud className="w-8 h-8" />
          </div>
          <span className="text-sm font-bold text-blue-900">Drop file to attach</span>
          <span className="text-xs text-blue-600">PDF, DOCX, XLSX, PNG, JPG</span>
        </div>
      )}

      {!isReady && (
        <div className="animate-pulse space-y-4 py-8">
          <div className="h-10 bg-slate-100 rounded-md w-3/4 mb-6"></div>
          <div className="h-5 bg-slate-100 rounded w-full"></div>
          <div className="h-5 bg-slate-100 rounded w-5/6"></div>
          <div className="h-7 bg-slate-100 rounded-md w-1/2 mt-8 mb-4"></div>
          <div className="h-5 bg-slate-100 rounded w-full"></div>
        </div>
      )}


      <article
        data-editor-canvas="true"
        data-readonly={isReadOnly ? 'true' : 'false'}
        className="max-w-none focus:outline-none min-h-[700px] print:p-0"
      >
        <div ref={editorRef} data-editor-surface="true" tabIndex={0} />
      </article>
    </div>
  );
}

