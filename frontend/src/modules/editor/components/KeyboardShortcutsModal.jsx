import React from 'react';
import { X, Keyboard } from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    category: 'Essential Formatting',
    items: [
      { label: 'Bold', keys: ['Ctrl', 'B'] },
      { label: 'Italic', keys: ['Ctrl', 'I'] },
      { label: 'Underline', keys: ['Ctrl', 'U'] },
      { label: 'Inline Code', keys: ['Ctrl', '`'] },
      { label: 'Insert Link', keys: ['Ctrl', 'K'] },
    ],
  },
  {
    category: 'Headings & Structure',
    items: [
      { label: 'Heading 1', keys: ['Ctrl', 'Alt', '1'] },
      { label: 'Heading 2', keys: ['Ctrl', 'Alt', '2'] },
      { label: 'Heading 3', keys: ['Ctrl', 'Alt', '3'] },
      { label: 'Paragraph', keys: ['Ctrl', 'Alt', '0'] },
      { label: 'Slash Commands Menu', keys: ['/'] },
    ],
  },
  {
    category: 'Lists & Blocks',
    items: [
      { label: 'Bullet List', keys: ['Ctrl', 'Shift', '8'] },
      { label: 'Numbered List', keys: ['Ctrl', 'Shift', '7'] },
      { label: 'Task Checklist', keys: ['Ctrl', 'Shift', '9'] },
      { label: 'Blockquote / Callout', keys: ['Ctrl', 'Shift', 'B'] },
      { label: 'Code Block', keys: ['Ctrl', 'Alt', 'C'] },
    ],
  },
  {
    category: 'Collaboration & Navigation',
    items: [
      { label: 'Add Comment Anchor', keys: ['Ctrl', 'Alt', 'M'] },
      { label: 'Undo', keys: ['Ctrl', 'Z'] },
      { label: 'Redo', keys: ['Ctrl', 'Y'] },
      { label: 'Print / Export to PDF', keys: ['Ctrl', 'P'] },
    ],
  },
];

export function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-500">Quick commands to speed up your editing workflow</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {group.category}
              </h3>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-xs font-medium text-slate-700">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200 rounded shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

