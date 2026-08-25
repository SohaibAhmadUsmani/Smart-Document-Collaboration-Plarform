import React from 'react';

export function PaperDocumentSheet({
  editorRef,
  isReady = true,
  isReadOnly = false,
}) {
  return (
    <div className="w-full max-w-[860px] min-h-[1100px] bg-white rounded-xl border border-slate-200/90 shadow-[0_4px_24px_-2px_rgba(15,23,42,0.08),0_2px_8px_-1px_rgba(15,23,42,0.04)] p-14 sm:p-20 mb-16 transition-shadow duration-300">
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
        className="max-w-none focus:outline-none min-h-[700px]"
      >
        <div ref={editorRef} data-editor-surface="true" tabIndex={0} />
      </article>
    </div>
  );
}
