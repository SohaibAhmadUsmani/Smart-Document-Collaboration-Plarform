import React, { useState } from 'react';
import {
  FileText,
  ChevronRight,
  RefreshCw,
  Check,
  Share2,
  UploadCloud,
  Plus,
  CloudOff,
} from 'lucide-react';
import { MOCK_COLLABORATORS } from '../services/mockData.js';
import { SAVE_STATUS } from '../types/document.js';

export function DocSubHeader({
  documentTitle = 'Q3 Marketing Strategy & Execution Plan',
  workspaceName = 'Workspaces',
  saveStatus = SAVE_STATUS.SAVED,
  lastSavedAt = null,
  onTitleChange,
  onShareClick,
  onPublishClick,
}) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(documentTitle);

  const isSaving = saveStatus === SAVE_STATUS.SAVING;
  const isError = saveStatus === SAVE_STATUS.ERROR;

  const handlePublish = async () => {
    setIsPublishing(true);
    if (onPublishClick) {
      await onPublishClick();
    }
    setTimeout(() => {
      setIsPublishing(false);
      setIsPublished(true);
      setTimeout(() => setIsPublished(false), 3000);
    }, 800);
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && titleInput !== documentTitle && onTitleChange) {
      onTitleChange(titleInput.trim());
    }
  };

  return (
    <div className="h-14 w-full px-6 flex items-center justify-between border-b border-slate-200 bg-white sticky top-12 z-40 select-none">
      {/* Left: Breadcrumbs & Live Sync Pill */}
      <div className="flex items-center gap-2 overflow-hidden">
        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />

        <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        <span className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer transition-colors truncate">
          {workspaceName}
        </span>

        <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            className="text-xs font-bold text-slate-900 border border-blue-400 rounded px-1.5 py-0.5 outline-none"
            autoFocus
          />
        ) : (
          <span
            onClick={() => setIsEditingTitle(true)}
            className="text-xs font-bold text-slate-900 truncate max-w-[280px] hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer transition-colors"
            title="Click to rename"
          >
            {documentTitle}
          </span>
        )}

        {/* Live Sync Status Pill */}
        <div className="ml-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 shadow-2xs transition-all duration-200">
          {isSaving ? (
            <>
              <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
              <span className="text-[11px] font-semibold text-emerald-700">
                Saving...
              </span>
            </>
          ) : isError ? (
            <>
              <CloudOff className="w-3 h-3 text-amber-600" />
              <span className="text-[11px] font-semibold text-amber-700">
                Saved Locally
              </span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">
                Live Syncing
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Collaborators Avatar Stack, Share, and Publish */}
      <div className="flex items-center gap-3">
        {/* Collaborators Avatar Stack */}
        <div className="flex items-center -space-x-2 mr-2">
          {MOCK_COLLABORATORS.map((collab) => (
            <div
              key={collab.id}
              className="relative group cursor-pointer"
              onMouseEnter={() => setActiveTooltip(collab.id)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <img
                src={collab.avatar}
                alt={collab.name}
                className="w-7 h-7 rounded-full ring-2 ring-white object-cover transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:z-10"
              />
              {collab.status === 'editing' && (
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
              )}
              {activeTooltip === collab.id && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 px-2 py-1 bg-slate-900 text-white text-[10px] font-medium rounded shadow-lg whitespace-nowrap pointer-events-none">
                  {collab.name} ({collab.status})
                </div>
              )}
            </div>
          ))}

          {/* Add Collaborator Button */}
          <button
            type="button"
            className="w-7 h-7 rounded-full ring-2 ring-white bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold transition-colors"
            title="Invite Collaborator"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={onShareClick}
          className="h-8.5 px-3.5 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all active:scale-98"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Share</span>
        </button>

        {/* Publish Button (Primary CTA) */}
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPublishing}
          className="h-8.5 px-4 flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-98 text-xs font-bold text-white shadow-xs transition-all glint-overlay"
        >
          {isPublished ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Published</span>
            </>
          ) : isPublishing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5 text-white" />
              <span>Publish</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
