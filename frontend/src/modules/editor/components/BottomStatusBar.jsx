/**
 * @file BottomStatusBar.jsx
 * @description Fixed bottom footer bar displaying document metrics and workspace context for DocSync Pro.
 * Provides word count, character count, estimated reading time, last modifier, folder location, and zoom slider.
 * @module frontend/src/modules/editor/components/BottomStatusBar
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh fixed bottom status bar hai jo live metrics display karti hai:
 * Total words, total characters, estimated reading time (200 words/min), last editor ka naam,
 * folder location, aur document zoom scale slider (50% to 150%).
 */

import React, { useState } from 'react';
import { Clock, UserCheck, Folder, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * BottomStatusBar Component (DocSync Pro Status Bar).
 *
 * [ROMAN URDU]:
 * Document metrics aur metadata status bar component.
 *
 * @param {Object} props
 * @param {number} [props.wordCount=482] - Total word count
 * @param {number} [props.characterCount=3105] - Total character count
 * @param {string} [props.lastEditedBy='Sarah Chen'] - Name of last user who edited
 * @param {string} [props.lastEditedAt='5 mins ago'] - Time string of last edit
 * @param {string} [props.folderLocation='Marketing / Strategies'] - Folder path in workspace
 * @returns {React.JSX.Element}
 */
export function BottomStatusBar({
  wordCount = 482,
  characterCount = 3105,
  lastEditedBy = 'Sarah Chen',
  lastEditedAt = '5 mins ago',
  folderLocation = 'Marketing / Strategies',
}) {
  const [zoomLevel, setZoomLevel] = useState(100);

  // Estimate reading time in minutes (200 wpm standard)
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleZoomChange = (delta) => {
    setZoomLevel((prev) => Math.min(150, Math.max(50, prev + delta)));
  };

  return (
    <footer
      role="contentinfo"
      aria-label="Document Metadata and Statistics Bar"
      className="h-8.5 w-full px-3 sm:px-6 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs fixed bottom-0 left-0 right-0 z-30 select-none text-[11px] text-slate-500 dark:text-slate-400"
    >
      {/* Left: Metrics (Words, Characters, Reading Time) */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{wordCount}</span> words
        </div>
        <div className="hidden xs:flex items-center gap-1.5 font-medium">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{characterCount}</span> characters
        </div>
        <div className="hidden sm:flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <Clock className="w-3 h-3" />
          <span>{readingTime} min read</span>
        </div>
      </div>

      {/* Center: Folder / Workspace Breadcrumb Location */}
      <div className="hidden md:flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
        <Folder className="w-3.5 h-3.5 text-slate-400" />
        <span className="truncate max-w-[200px]">{folderLocation}</span>
      </div>

      {/* Right: Last Editor & Zoom Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden sm:inline">Edited by</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[80px] sm:max-w-none">{lastEditedBy}</span>
          <span className="text-[10px] text-slate-400 font-mono">({lastEditedAt})</span>
        </div>

        {/* Zoom Slider */}
        <div className="hidden lg:flex items-center gap-1 pl-3 border-l border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleZoomChange(-10)}
            aria-label="Zoom Out"
            className="p-1 hover:text-slate-800 dark:hover:text-slate-200 rounded"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="w-9 text-center font-mono font-semibold text-[10px] text-slate-700 dark:text-slate-300">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={() => handleZoomChange(10)}
            aria-label="Zoom In"
            className="p-1 hover:text-slate-800 dark:hover:text-slate-200 rounded"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default BottomStatusBar;
