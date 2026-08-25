import React from 'react';
import { Clock, Folder } from 'lucide-react';

export function BottomStatusBar({
  wordCount = 482,
  characterCount = 3105,
  lastEditedBy = 'Sarah Chen',
  lastEditedAt = '5 mins ago',
  folderLocation = 'Marketing / Strategies',
}) {
  return (
    <footer className="h-10 w-full px-6 flex items-center justify-between border-t border-slate-200 bg-white/95 backdrop-blur text-xs text-slate-600 select-none fixed bottom-0 left-0 right-0 z-40">
      {/* Left: Live metrics & editor info */}
      <div className="flex items-center gap-4">
        <span>
          Words: <strong className="font-bold text-slate-900">{wordCount}</strong>
        </span>
        <span className="text-slate-300">•</span>
        <span>
          Characters: <strong className="font-bold text-slate-900">{characterCount.toLocaleString()}</strong>
        </span>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Last edited {lastEditedAt} by{' '}
            <span className="font-semibold text-slate-900">{lastEditedBy}</span>
          </span>
        </div>
      </div>

      {/* Right: Folder / Save Destination */}
      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100/80 text-slate-700 text-xs font-medium">
        <Folder className="w-3.5 h-3.5 text-slate-400" />
        <span>Saved to "{folderLocation}"</span>
      </div>
    </footer>
  );
}
