/**
 * @file KeyboardShortcutsModal.jsx
 * @description Accessible keyboard shortcut reference modal for DocSync Pro.
 * Displays shortcuts for text formatting, blocks & lists, and application navigation.
 * @module frontend/src/modules/editor/components/KeyboardShortcutsModal
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh modal dialog user ko document editor ke tamam keyboard shortcuts dikhata hai.
 * Escape key dabane par automatically close ho jata hai aur accessibility (role="dialog",
 * aria-modal="true") ke standards follow karta hai.
 */

import React, { useEffect } from 'react';
import { X, Command, Keyboard } from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    category: 'Essential Formatting',
    items: [
      { label: 'Bold', keys: ['Ctrl', 'B'] },
      { label: 'Italic', keys: ['Ctrl', 'I'] },
      { label: 'Underline', keys: ['Ctrl', 'U'] },
      { label: 'Strikethrough', keys: ['Ctrl', 'Shift', 'X'] },
      { label: 'Inline Code', keys: ['Ctrl', 'E'] },
    ],
  },
  {
    category: 'Structure & Lists',
    items: [
      { label: 'Heading 1', keys: ['Ctrl', 'Alt', '1'] },
      { label: 'Heading 2', keys: ['Ctrl', 'Alt', '2'] },
      { label: 'Heading 3', keys: ['Ctrl', 'Alt', '3'] },
      { label: 'Bullet List', keys: ['Ctrl', 'Shift', '8'] },
      { label: 'Numbered List', keys: ['Ctrl', 'Shift', '7'] },
      { label: 'Task Checklist', keys: ['Ctrl', 'Shift', '9'] },
      { label: 'Blockquote', keys: ['Ctrl', 'Shift', 'B'] },
    ],
  },
  {
    category: 'Navigation & Commands',
    items: [
      { label: 'Quick Insert Slash Menu', keys: ['/'] },
      { label: 'Global Search', keys: ['Ctrl', 'K'] },
      { label: 'Toggle Zen Mode', keys: ['F11'] },
      { label: 'Shortcuts Help', keys: ['Ctrl', '/'] },
      { label: 'Undo / Redo', keys: ['Ctrl', 'Z', '/', 'Ctrl', 'Y'] },
    ],
  },
];

/**
 * Keyboard Shortcuts Modal Dialog.
 *
 * [ROMAN URDU]:
 * Keyboard shortcuts modal component.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Close callback
 * @returns {React.JSX.Element|null}
 */
export function KeyboardShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Master DocSync Pro with speed</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {group.category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-600 shadow-2xs"
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
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Press <kbd className="font-mono text-[10px] font-bold px-1 bg-white dark:bg-slate-700 rounded border">Esc</kbd> to close</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsModal;
