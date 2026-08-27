import React from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link,
  MessageSquarePlus,
} from 'lucide-react';

export function BubbleFloatingMenu({ editor, onAddComment }) {
  if (!editor) return null;

  const isTextSelected = !editor.state.selection.empty;
  if (!isTextSelected) return null;

  const handleToggleBold = () => editor.chain().focus().toggleBold().run();
  const handleToggleItalic = () => editor.chain().focus().toggleItalic().run();
  const handleToggleUnderline = () => editor.chain().focus().toggleUnderline().run();
  const handleToggleStrike = () => editor.chain().focus().toggleStrike().run();
  const handleToggleCode = () => editor.chain().focus().toggleCode().run();

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const handleComment = () => {
    if (onAddComment) {
      onAddComment();
    } else {
      const threadId = `cmt_${Date.now()}`;
      editor.chain().focus().setMark('commentMark', { commentThreadId: threadId, isActive: true }).run();
    }
  };

  return (
    <div className="flex items-center gap-0.5 bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md px-1.5 py-1 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
      <button
        type="button"
        title="Bold (Ctrl+B)"
        onClick={handleToggleBold}
        className={`p-1.5 rounded-md text-xs hover:bg-slate-800 transition-colors ${
          editor.isActive('bold') ? 'bg-blue-600 text-white font-bold' : 'text-slate-300'
        }`}
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Italic (Ctrl+I)"
        onClick={handleToggleItalic}
        className={`p-1.5 rounded-md text-xs hover:bg-slate-800 transition-colors ${
          editor.isActive('italic') ? 'bg-blue-600 text-white' : 'text-slate-300'
        }`}
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Underline (Ctrl+U)"
        onClick={handleToggleUnderline}
        className={`p-1.5 rounded-md text-xs hover:bg-slate-800 transition-colors ${
          editor.isActive('underline') ? 'bg-blue-600 text-white' : 'text-slate-300'
        }`}
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Strikethrough"
        onClick={handleToggleStrike}
        className={`p-1.5 rounded-md text-xs hover:bg-slate-800 transition-colors ${
          editor.isActive('strike') ? 'bg-blue-600 text-white' : 'text-slate-300'
        }`}
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Inline Code"
        onClick={handleToggleCode}
        className={`p-1.5 rounded-md text-xs hover:bg-slate-800 transition-colors ${
          editor.isActive('code') ? 'bg-blue-600 text-white' : 'text-slate-300'
        }`}
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-slate-700 mx-1" />

      <button
        type="button"
        title="Insert Link"
        onClick={handleSetLink}
        className={`p-1.5 rounded-md text-xs hover:bg-slate-800 transition-colors ${
          editor.isActive('link') ? 'bg-blue-600 text-white' : 'text-slate-300'
        }`}
      >
        <Link className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Add Comment (Ctrl+Alt+M)"
        onClick={handleComment}
        className="flex items-center gap-1 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-md text-xs transition-colors shadow-xs ml-1"
      >
        <MessageSquarePlus className="w-3.5 h-3.5" />
        <span>Comment</span>
      </button>
    </div>
  );
}
