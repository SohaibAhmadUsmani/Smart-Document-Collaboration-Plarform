/**
 * @file ConflictResolutionModal.jsx
 * @description Optimistic Concurrency Control (OCC) 409 Conflict Resolution UI modal.
 * Compares local unsaved edits against latest server version with 3 resolution workflows.
 * @module frontend/src/modules/editor/components/ConflictResolutionModal
 *
 * [ROMAN URDU]:
 * Jab do ya ziada collaborators aik hi waqt mein document edit kar rahe hon aur backend par
 * HTTP 409 Version Conflict aye, toh yeh modal open hota hai.
 * Yeh user ko local changes aur server version ka comparison dikhata hai aur 3 clear options deta hai:
 * 1. "Keep My Local Version" (Force overwrite with incremented version)
 * 2. "Discard & Load Server Version" (Server AST se canvas re-hydrate karna)
 * 3. "Save Local Copy" (Local draft ka alag naya document banana)
 */

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  UploadCloud,
  RefreshCw,
  Copy,
  X,
  Clock,
  User,
  CheckCircle2,
  FileText,
  ArrowRight,
} from 'lucide-react';

/**
 * Helper to extract word and char counts from text.
 */
function getStats(text = '') {
  const clean = String(text || '').trim();
  const words = clean ? clean.split(/\s+/).length : 0;
  const characters = clean.length;
  return { words, characters };
}

/**
 * Optimistic Concurrency Control Conflict Resolution Modal Component.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Modal close handler
 * @param {Object|null} props.localContent - User's local unsaved AST
 * @param {string} [props.localPlainText=''] - Local plain text
 * @param {Object|null} props.serverDocument - Latest server document record
 * @param {Function} props.onKeepLocal - Callback to force overwrite local version
 * @param {Function} props.onDiscardAndLoadServer - Callback to reload server AST
 * @param {Function} props.onSaveLocalCopy - Callback to duplicate draft as new doc
 */
export function ConflictResolutionModal({
  isOpen,
  onClose,
  localContent,
  localPlainText = '',
  serverDocument = null,
  onKeepLocal,
  onDiscardAndLoadServer,
  onSaveLocalCopy,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState(null); // 'local' | 'server' | 'copy'

  const localStats = useMemo(() => getStats(localPlainText), [localPlainText]);
  const serverStats = useMemo(
    () => getStats(serverDocument?.plainText || ''),
    [serverDocument?.plainText]
  );

  if (!isOpen) return null;

  const serverVersion = serverDocument?.version || 2;
  const serverUpdatedTime = serverDocument?.updatedAt
    ? new Date(serverDocument.updatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Recently';

  // Handler for Option 1: Keep My Local Version
  const handleKeepLocal = async () => {
    try {
      setIsProcessing(true);
      setProcessingAction('local');
      if (onKeepLocal) await onKeepLocal();
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  // Handler for Option 2: Discard & Load Server Version
  const handleDiscardAndLoadServer = async () => {
    try {
      setIsProcessing(true);
      setProcessingAction('server');
      if (onDiscardAndLoadServer) await onDiscardAndLoadServer();
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  // Handler for Option 3: Save Local Copy
  const handleSaveLocalCopy = async () => {
    try {
      setIsProcessing(true);
      setProcessingAction('copy');
      if (onSaveLocalCopy) await onSaveLocalCopy();
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 1. Header with Warning Accent */}
        <div className="px-6 py-5 border-b border-slate-200 bg-amber-50/60 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Version Conflict Detected (HTTP 409)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-amber-200/80 text-amber-900 rounded-full">
                  OCC Mismatch
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Another collaborator saved newer edits to this document while you were editing. Choose how to resolve this collision to prevent accidental data loss.
              </p>
              <p className="text-[11px] text-amber-800/90 font-medium italic mt-0.5">
                [ROMAN URDU]: Server par naya version mojood hai. Data ko mehfooz rakhne ke liye neeche diye gaye tareeqon mein se intekhab karein.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Side-by-Side Version Snapshot Comparison */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Box: Local Changes */}
            <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="text-xs font-bold text-slate-900">Your Local Edits (Unsaved)</span>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                  In Memory
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span><strong>{localStats.words}</strong> words</span>
                <span>•</span>
                <span><strong>{localStats.characters}</strong> chars</span>
                <span>•</span>
                <span className="text-emerald-700 font-medium">Draft state</span>
              </div>

              {/* Monospace preview box */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-[11.5px] text-slate-700 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-2xs">
                {localPlainText ? localPlainText.slice(0, 400) : '(No text in local draft)'}
              </div>
            </div>

            {/* Right Box: Server Changes */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-xs font-bold text-slate-900">Server Latest State</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md">
                  v{serverVersion}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span><strong>{serverStats.words}</strong> words</span>
                <span>•</span>
                <span><strong>{serverStats.characters}</strong> chars</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {serverUpdatedTime}
                </span>
              </div>

              {/* Monospace preview box */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-[11.5px] text-slate-700 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-2xs">
                {serverDocument?.plainText ? serverDocument.plainText.slice(0, 400) : '(Server document empty or loading)'}
              </div>
            </div>
          </div>

          {/* 3. Action Selection Cards */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Select Resolution Strategy
            </h3>

            {/* Option 1: Keep My Local Version */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleKeepLocal}
              className="w-full text-left p-3.5 rounded-xl border border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 transition-all group flex items-center justify-between shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Option 1: Keep My Local Version
                    </span>
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                      Force Overwrite
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 mt-0.5">
                    Overwrite server version with your local changes. Increments version sequence to v{serverVersion + 1}.
                  </p>
                  <p className="text-[10.5px] text-blue-700 font-medium italic mt-0.5">
                    [ROMAN URDU]: Apni local changes ko force save karein aur naya version banayein.
                  </p>
                </div>
              </div>
              <div className="pl-3">
                {processingAction === 'local' ? (
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                )}
              </div>
            </button>

            {/* Option 2: Discard & Load Server Version */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDiscardAndLoadServer}
              className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all group flex items-center justify-between shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Option 2: Discard &amp; Load Server Version
                    </span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                      Re-hydrate
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 mt-0.5">
                    Discard unsaved local edits and reload the server's latest document AST into the editor.
                  </p>
                  <p className="text-[10.5px] text-slate-600 font-medium italic mt-0.5">
                    [ROMAN URDU]: Local tabdeelion ko chhor kar server ka taza tareen version editor mein load karein.
                  </p>
                </div>
              </div>
              <div className="pl-3">
                {processingAction === 'server' ? (
                  <RefreshCw className="w-4 h-4 text-slate-600 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
                )}
              </div>
            </button>

            {/* Option 3: Save Local Copy */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSaveLocalCopy}
              className="w-full text-left p-3.5 rounded-xl border border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 transition-all group flex items-center justify-between shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Option 3: Save Local Copy
                    </span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                      New Branch
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 mt-0.5">
                    Preserve your work by duplicating your local draft into a new standalone document branch.
                  </p>
                  <p className="text-[10.5px] text-emerald-700 font-medium italic mt-0.5">
                    [ROMAN URDU]: Apne local draft ko aik alag naye document ke tor par mehfooz karein.
                  </p>
                </div>
              </div>
              <div className="pl-3">
                {processingAction === 'copy' ? (
                  <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* 4. Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Error Code: 409 VERSION_CONFLICT
          </span>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 rounded-lg transition-colors"
          >
            Cancel / Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConflictResolutionModal;
