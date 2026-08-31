/**
 * @file BubbleFloatingMenu.jsx
 * @description Floating bubble menu component that appears when selecting text ranges in TipTap.
 * Provides quick formatting actions (Bold, Italic, Strike, Code, Link, Comment).
 * @module frontend/src/modules/editor/components/BubbleFloatingMenu
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Jab user mouse se text select karta hai toh yeh floating bubble menu appear hota hai.
 * Quick bold, italic, code, aur selection par naya comment anchor attach karne ka button provide karta hai.
 */

import React, { useState, useEffect } from 'react';
import { Bold, Italic, Strikethrough, Code, Link2, MessageSquarePlus } from 'lucide-react';

/**
 * BubbleFloatingMenu Component.
 *
 * [ROMAN URDU]:
 * Text selection par appear hone wala floating formatting menu.
 *
 * @param {Object} props
 * @param {Object} props.editor - TipTap editor instance
 * @param {Function} [props.onAddComment] - Callback to attach a comment to active selection
 * @returns {React.JSX.Element|null}
 */
export function BubbleFloatingMenu({ editor, onAddComment }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateVisibility = () => {
      const { from, to } = editor.state.selection;
      const isTextSelected = from !== to;
      setIsVisible(isTextSelected && editor.isFocused);
    };

    editor.on('selectionUpdate', updateVisibility);
    editor.on('blur', () => setIsVisible(false));

    return () => {
      editor.off('selectionUpdate', updateVisibility);
    };
  }, [editor]);

  if (!isVisible || !editor) return null;

  const btnClass = (isActive) =>
    `p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs ${
      isActive
        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 font-bold'
        : 'text-slate-700 dark:text-slate-200'
    }`;

  return (
    <div
      role="toolbar"
      aria-label="Floating text selection menu"
      className="flex items-center gap-0.5 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-40 animate-in fade-in zoom-in-95 duration-100"
    >
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive('strike'))}
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={btnClass(editor.isActive('code'))}
        title="Inline Code"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const url = window.prompt('Enter Link URL:');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
        className={btnClass(editor.isActive('link'))}
        title="Link"
      >
        <Link2 className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onAddComment && onAddComment()}
        className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs flex items-center gap-1 font-semibold"
        title="Comment on Selection"
      >
        <MessageSquarePlus className="w-3.5 h-3.5" />
        <span className="text-[10px]">Comment</span>
      </button>
    </div>
  );
}

export default BubbleFloatingMenu;
