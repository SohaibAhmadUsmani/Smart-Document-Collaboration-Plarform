/**
 * @file DocSubHeader.jsx
 * @description Document sub-header and breadcrumb navigation bar component for DocSync Pro.
 * Provides breadcrumb hierarchy, inline title editing with auto-truncation, real-time sync status pill,
 * active collaborator avatars, and responsive action menus.
 * @module frontend/src/modules/editor/components/DocSubHeader
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh component document ka sub-header hai jisme breadcrumbs, title inline edit,
 * live sync status, active collaborators ki list, aur action buttons hain. Choti screens (< 640px)
 * par layout break hone se bachne ke liye title truncate hota hai aur buttons mobile menu mein collapse
 * ho jaate hain.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SmartBackButton } from './SmartBackButton.jsx';
import {
  FileText,
  ChevronRight,
  RefreshCw,
  Check,
  Share2,
  UploadCloud,
  Plus,
  CloudOff,
  ArrowLeft,
  MoreVertical,
  Keyboard,
  History,
  Pencil,
  Folder,
} from 'lucide-react';
import { SAVE_STATUS } from '../types/document.js';

/**
 * DocSubHeader Component (DocSync Pro Sub-Header & Breadcrumb Bar).
 *
 * [ROMAN URDU]:
 * Document sub-header jo breadcrumbs, inline title rename, collaborator presence,
 * aur share/publish actions provide karta hai.
 *
 * @param {Object} props
 * @param {string} [props.documentTitle='Q3 Marketing Strategy & Execution Plan'] - Current document title
 * @param {string} [props.workspaceName='Workspaces'] - Name of parent workspace / folder
 * @param {string} [props.saveStatus='saved'] - Current save status token
 * @param {Date|null} [props.lastSavedAt=null] - Timestamp of last successful autosave
 * @param {Function} [props.onTitleChange] - Callback triggered when title is edited
 * @param {Function} [props.onShareClick] - Handler for share modal trigger
 * @param {Function} [props.onPublishClick] - Handler for publish workflow
 * @param {Function} [props.onOpenShortcuts] - Handler to toggle shortcuts modal
 * @returns {React.JSX.Element}
 */
export function DocSubHeader({
  documentTitle = 'Q3 Marketing Strategy & Execution Plan',
  workspaceName = 'Workspaces',
  saveStatus = SAVE_STATUS.SAVED,
  lastSavedAt = null,
  activeUsers = [],
  onTitleChange,
  onShareClick,
  onInviteClick,
  onOpenShortcuts,
  onOpenHistory,
}) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(documentTitle);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // Sync titleInput if documentTitle prop changes externally
  useEffect(() => {
    setTitleInput(documentTitle);
  }, [documentTitle]);

  // Close mobile dropdown on outside click or Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileMenuOpen]);

  const isSaving = saveStatus === SAVE_STATUS.SAVING;
  const isError = saveStatus === SAVE_STATUS.ERROR || saveStatus === SAVE_STATUS.OFFLINE_SAVED;

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && titleInput !== documentTitle && onTitleChange) {
      onTitleChange(titleInput.trim());
    } else if (!titleInput.trim()) {
      setTitleInput(documentTitle);
    }
  };

  return (
    <div
      role="region"
      aria-label="Document Navigation Bar"
      className="h-14 w-full px-3 sm:px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-12 z-40 select-none"
    >
      {/* Left: Breadcrumbs & Inline Title Edit */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 mr-2">
        {/* Smart history-aware back navigation */}
        <SmartBackButton
          fallbackPath="/workspaces"
          className="mr-0.5 p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Go Back"
        />
        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />

        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
        
        {/* Interactive Workspace Breadcrumb */}
        <Link
          to="/workspaces"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors truncate max-w-[110px] sm:max-w-[160px]"
          title={workspaceName}
        >
          <Folder className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="truncate">{workspaceName}</span>
        </Link>

        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />

        {/* Title Truncation with Inline Edit Input */}
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTitleInput(documentTitle);
                  setIsEditingTitle(false);
                }
              }}
              aria-label="Edit document title"
              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white border-2 border-blue-500 bg-white dark:bg-slate-800 rounded-lg px-2.5 py-0.5 outline-none max-w-[150px] xs:max-w-[220px] sm:max-w-xs md:max-w-md w-full shadow-xs focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
            <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">↵ save</span>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingTitle(true)}
            className="group/title flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer transition-colors max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-md"
            title={`${documentTitle} (Click to rename)`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(true)}
            aria-label={`Document title: ${documentTitle}. Press Enter or click to rename.`}
          >
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {documentTitle}
            </span>
            <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        )}

        {/* Live Sync Status Pill */}
        <div
          role="status"
          aria-live="polite"
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 flex-shrink-0 text-[11px] font-semibold ${
            isSaving
              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-300'
              : isError
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800 text-amber-700 dark:text-amber-300'
              : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-spin" />
              <span>Saving changes...</span>
            </>
          ) : isError ? (
            <>
              <CloudOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Saved locally</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Saved to workspace</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Collaborators Avatar Stack, History, and Share */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Collaborators Avatar Stack */}
        <div className="flex items-center -space-x-2 mr-1 sm:mr-2">
          {activeUsers.slice(0, 4).map((collab, index) => {
            const displayName = collab.name || collab.email || 'Collaborator';
            const initials = displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            const userKey = collab.userId || collab.socketId || index;

            return (
              <div
                key={userKey}
                className="relative group cursor-pointer"
                onMouseEnter={() => setActiveTooltip(userKey)}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                {collab.avatar ? (
                  <img
                    src={collab.avatar}
                    alt={displayName}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:z-10"
                  />
                ) : (
                  <div
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-[10px] font-bold transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:z-10 shadow-2xs"
                    title={displayName}
                  >
                    {initials}
                  </div>
                )}
                <span
                  className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900"
                  title="Online"
                />
                {activeTooltip === userKey && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 px-2 py-1 bg-slate-900 text-white text-[10px] font-medium rounded shadow-lg whitespace-nowrap pointer-events-none">
                    {displayName} {collab.role ? `(${collab.role})` : ''}
                  </div>
                )}
              </div>
            );
          })}

          {activeUsers.length > 4 && (
            <div
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold"
              title={`${activeUsers.length - 4} more online`}
            >
              +{activeUsers.length - 4}
            </div>
          )}

          {/* Add Collaborator Button */}
          <button
            type="button"
            onClick={onInviteClick || onShareClick}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
            title="Invite Collaborator"
            aria-label="Invite Collaborator"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desktop Shortcut Button (Hidden on < 640px) */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (Ctrl+/)"
          aria-label="Open Keyboard Shortcuts Modal (Ctrl+/)"
          className="hidden md:flex h-8.5 px-2.5 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-2xs transition-colors"
        >
          <span className="font-mono text-[10px] font-semibold text-slate-400 dark:text-slate-400">Ctrl+/</span>
        </button>

        {/* History Button */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="h-8.5 px-3.5 flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-all active:scale-98"
          title="View Version History"
        >
          <History className="w-3.5 h-3.5 text-blue-600" />
          <span>History</span>
        </button>

        {/* Share Button (Primary CTA) */}
        <button
          type="button"
          onClick={onShareClick}
          aria-label="Share document"
          title="Share document"
          className="h-8.5 px-3.5 sm:px-4.5 flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-white" />
          <span>Share</span>
        </button>

        {/* Mobile Action Overflow Menu Button (Visible on < 640px) */}
        <div className="relative md:hidden" ref={mobileMenuRef}>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="More actions"
            aria-expanded={mobileMenuOpen}
            className="h-8.5 w-8.5 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {mobileMenuOpen && (
            <div
              role="menu"
              aria-label="Mobile actions menu"
              className="absolute right-0 top-10 z-50 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenShortcuts?.();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                <span>Shortcuts (Ctrl+/)</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onShareClick?.();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Share Document</span>
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

              <div className="px-3.5 py-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                Sync: {isSaving ? 'Saving...' : isError ? 'Offline' : 'Live Syncing'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocSubHeader;
