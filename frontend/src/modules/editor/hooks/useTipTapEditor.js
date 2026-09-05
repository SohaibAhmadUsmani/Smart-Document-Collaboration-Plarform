/**
 * @file useTipTapEditor.js
 * @description Headless TipTap editor integration hook for DocSync Pro.
 * Mounts editor instance onto a DOM element ref, synchronizes reactive state,
 * and exposes rich formatting commands with active mark tracking.
 * @module frontend/src/modules/editor/hooks/useTipTapEditor
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh hook TipTap ProseMirror editor instance ko initialize aur manage karta hai.
 * DOM element par editor mount karta hai, real-time typing par content sync karta hai,
 * active formatting marks track karta hai, aur formatting commands (bold, lists, tables, etc.)
 * execute karta hai.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@tiptap/core';
import { getEditorExtensions } from '../extensions/schema.js';
import { useDocumentEditor } from './useDocumentEditor.js';

function parseDocContent(content) {
  if (!content) return { type: 'doc', content: [] };
  let parsed = content;
  while (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('"')) {
      try {
        const next = JSON.parse(trimmed);
        if (next === parsed) break;
        parsed = next;
      } catch {
        break;
      }
    } else {
      break;
    }
  }
  if (typeof parsed === 'object' && parsed !== null) {
    return parsed;
  }
  return content;
}

/**
 * Headless TipTap editor integration hook.
 *
 * [ROMAN URDU]:
 * TipTap editor instance, mounting ref, ready state flag, aur command dispatcher return karta hai.
 *
 * @param {Object} [options={}] - Configuration options (initialContent, etc.)
 * @returns {{ editorRef: React.RefObject, editor: Object|null, editorInstance: Object|null, isReady: boolean, executeCommand: Function }}
 */
export function useTipTapEditor(options = {}) {
  const { state, updateContent, setActiveMarks, setActiveCommentThread } = useDocumentEditor();
  const editorRef = useRef(null);
  const [editorInstance, setEditorInstance] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const lastMarksRef = useRef(null);
  // Track whether the current content change originated from local user typing (vs external load)
  const isLocalUpdateRef = useRef(false);
  const lastEmittedJsonStrRef = useRef(null);

  // 1. Initialize TipTap Editor Instance
  // Uses a mounted ref to survive React StrictMode's double-invocation in development,
  // which would otherwise create, destroy, and leave the editor in a broken state.
  useEffect(() => {
    if (!editorRef.current) return;

    const rawDoc = options.initialContent || state.content || { type: 'doc', content: [] };
    const initialDoc = parseDocContent(rawDoc);
    let updateTimeout = null;
    let destroyed = false;

    const editor = new Editor({
      element: editorRef.current,
      extensions: getEditorExtensions(options),
      content: initialDoc,
      editable: !state.isReadOnly,
      editorProps: {
        transformPastedHTML(html) {
          return html
            .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
        },
        handleKeyDown(view, event) {
          if (event.key === 'Backspace') {
            const { selection } = view.state;
            if (selection.empty && selection.$from.parentOffset === 0) {
              const node = selection.$from.parent;
              if (node.content.size === 0) {
                const grandParent = selection.$from.node(-1);
                if (grandParent && (grandParent.type.name === 'blockquote' || grandParent.type.name === 'callout')) {
                  editor.commands.liftEmptyBlock();
                  return true;
                }
              }
            }
          }
          return false;
        },
      },
      onUpdate: ({ editor: ed }) => {
        if (destroyed) return;
        if (updateTimeout) clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          if (destroyed) return;
          const json = ed.getJSON();
          const text = ed.getText();
          // Mark that the upcoming state.content change came from local typing,
          // not from an external document load — prevents the sync effect from
          // calling setContent() and resetting the cursor on every keystroke.
          isLocalUpdateRef.current = true;
          lastEmittedJsonStrRef.current = JSON.stringify(json);
          updateContent(json, text);
        }, 250);

        const getMarks = () => ({
          bold: ed.isActive('bold'),
          italic: ed.isActive('italic'),
          underline: ed.isActive('underline'),
          strike: ed.isActive('strike'),
          code: ed.isActive('code'),
          h1: ed.isActive('heading', { level: 1 }),
          h2: ed.isActive('heading', { level: 2 }),
          h3: ed.isActive('heading', { level: 3 }),
          bulletList: ed.isActive('bulletList'),
          orderedList: ed.isActive('orderedList'),
          taskList: ed.isActive('taskList'),
          blockquote: ed.isActive('blockquote') || ed.isActive('callout'),
          codeBlock: ed.isActive('codeBlock'),
          table: ed.isActive('table'),
          alignLeft: ed.isActive({ textAlign: 'left' }),
          alignCenter: ed.isActive({ textAlign: 'center' }),
          alignRight: ed.isActive({ textAlign: 'right' }),
          alignJustify: ed.isActive({ textAlign: 'justify' }),
          fontFamily: ed.getAttributes('fontFamily')?.fontFamily || 'Inter',
        });

        const marks = getMarks();
        const serialized = JSON.stringify(marks);
        if (serialized !== lastMarksRef.current) {
          lastMarksRef.current = serialized;
          setActiveMarks(marks);
        }
      },
      onSelectionUpdate: ({ editor: ed }) => {
        const marks = {
          bold: ed.isActive('bold'),
          italic: ed.isActive('italic'),
          underline: ed.isActive('underline'),
          strike: ed.isActive('strike'),
          code: ed.isActive('code'),
          h1: ed.isActive('heading', { level: 1 }),
          h2: ed.isActive('heading', { level: 2 }),
          h3: ed.isActive('heading', { level: 3 }),
          bulletList: ed.isActive('bulletList'),
          orderedList: ed.isActive('orderedList'),
          taskList: ed.isActive('taskList'),
          blockquote: ed.isActive('blockquote') || ed.isActive('callout'),
          codeBlock: ed.isActive('codeBlock'),
          table: ed.isActive('table'),
          alignLeft: ed.isActive({ textAlign: 'left' }),
          alignCenter: ed.isActive({ textAlign: 'center' }),
          alignRight: ed.isActive({ textAlign: 'right' }),
          alignJustify: ed.isActive({ textAlign: 'justify' }),
          fontFamily: ed.getAttributes('fontFamily')?.fontFamily || 'Inter',
        };
        const serialized = JSON.stringify(marks);
        if (serialized !== lastMarksRef.current) {
          lastMarksRef.current = serialized;
          setActiveMarks(marks);
        }
      },
    });

    setEditorInstance(editor);
    setIsReady(true);

    return () => {
      destroyed = true;
      if (updateTimeout) clearTimeout(updateTimeout);
      editor.destroy();
      setEditorInstance(null);
      setIsReady(false);
    };
  }, []);

  // 2. Reactive Content Synchronization (Handles Async Data & Template Loading)
  // Only syncs content that comes from outside the editor (initial load, template switch,
  // version restore, etc.). Skips updates caused by local user typing to prevent the
  // feedback loop where every keystroke would reset the cursor via setContent().
  useEffect(() => {
    if (editorInstance && state.content) {
      // If this content update was triggered by local typing, skip the sync
      // and clear the flag so the next external update is not blocked.
      if (isLocalUpdateRef.current) {
        isLocalUpdateRef.current = false;
        return;
      }

      const parsedContent = parseDocContent(state.content);
      const parsedStr = JSON.stringify(parsedContent);

      // If the content in state matches what this editor instance emitted locally, skip
      if (parsedStr === lastEmittedJsonStrRef.current) {
        return;
      }

      // CRITICAL: If the editor is currently focused by the user, DO NOT clobber
      // the active typing session with an external setContent call!
      if (editorInstance.isFocused) {
        return;
      }

      // CRITICAL SAFEGUARD: Never let an empty incoming content payload overwrite
      // non-empty user-typed content in the editor!
      const currentText = editorInstance.getText();
      if (currentText && currentText.trim().length > 0) {
        const incomingContent = parsedContent?.content;
        const isIncomingEmpty =
          !incomingContent ||
          incomingContent.length === 0 ||
          (incomingContent.length === 1 &&
            incomingContent[0]?.type === 'paragraph' &&
            (!incomingContent[0]?.content || incomingContent[0].content.length === 0));
        if (isIncomingEmpty) {
          return;
        }
      }

      const currentJSON = editorInstance.getJSON();
      const isDifferent = JSON.stringify(currentJSON) !== parsedStr;
      if (isDifferent) {
        // Preserve user selection cursor across external content updates
        const prevSelection = editorInstance.state?.selection;
        editorInstance.commands.setContent(parsedContent, false);
        if (prevSelection && editorInstance.state?.doc) {
          const maxPos = editorInstance.state.doc.content.size;
          const safeFrom = Math.min(Math.max(0, prevSelection.from), maxPos);
          const safeTo = Math.min(Math.max(0, prevSelection.to), maxPos);
          try {
            editorInstance.commands.setTextSelection({ from: safeFrom, to: safeTo });
          } catch (_) {}
        }
      }
    }
  }, [state.content, editorInstance]);

  // 3. Update Editable State Dynamically
  // TipTap v3 uses setOptions({ editable }) instead of the deprecated setEditable()
  useEffect(() => {
    if (editorInstance) {
      editorInstance.setOptions({ editable: !state.isReadOnly });
    }
  }, [state.isReadOnly, editorInstance]);

  // 4. Formatting Commands Execution Engine
  const executeCommand = useCallback(
    (command, payload = {}) => {
      if (!editorInstance || state.isReadOnly) return;

      const chain = editorInstance.chain().focus();

      switch (command) {
        case 'bold':
        case 'toggleBold':
          chain.toggleBold().run();
          break;
        case 'italic':
        case 'toggleItalic':
          chain.toggleItalic().run();
          break;
        case 'underline':
        case 'toggleUnderline':
          chain.toggleUnderline().run();
          break;
        case 'strike':
        case 'toggleStrike':
          chain.toggleStrike().run();
          break;
        case 'code':
        case 'toggleCode':
          chain.toggleCode().run();
          break;
        case 'heading':
        case 'toggleHeading':
          chain.toggleHeading({ level: payload.level || 1 }).run();
          break;
        case 'paragraph':
        case 'setParagraph':
          chain.setParagraph().run();
          break;
        case 'bulletList':
        case 'toggleBulletList':
          chain.toggleBulletList().run();
          break;
        case 'orderedList':
        case 'toggleOrderedList':
          chain.toggleOrderedList().run();
          break;
        case 'taskList':
        case 'toggleTaskList':
          chain.toggleTaskList().run();
          break;
        case 'blockquote':
        case 'toggleBlockquote':
          chain.toggleBlockquote().run();
          break;
        case 'codeBlock':
        case 'toggleCodeBlock':
          chain.toggleCodeBlock({ language: payload.language || 'plaintext' }).run();
          break;
        case 'setTextAlign':
          chain.setTextAlign(payload.align || payload || 'left').run();
          break;
        case 'setLink':
          if (payload.href) {
            chain.setLink({ href: payload.href }).run();
          } else {
            chain.unsetLink().run();
          }
          break;
        case 'setImage':
          if (payload.src) {
            chain.setImage({ src: payload.src }).run();
          }
          break;
        case 'insertTable':
        case 'table': {
          const rows = Math.max(1, payload.rows || 3);
          const cols = Math.max(1, payload.cols || 3);
          chain.insertTable({ rows, cols, withHeaderRow: true }).run();
          break;
        }
        case 'insertComment': {
          const threadId = `cmt_anchor_${Date.now()}`;
          chain.setMark('commentMark', { commentThreadId: threadId, isActive: true }).run();
          if (setActiveCommentThread) setActiveCommentThread(threadId);
          break;
        }
        case 'setFontFamily': {
          const font = payload?.fontFamily || payload;
          if (!font || font === 'Default' || font === 'Inter') {
            chain.unsetMark('fontFamily').run();
          } else {
            chain.setMark('fontFamily', { fontFamily: font }).run();
          }
          break;
        }
        case 'unsetFontFamily':
          chain.unsetMark('fontFamily').run();
          break;
        case 'undo':
          chain.undo().run();
          break;
        case 'redo':
          chain.redo().run();
          break;
        default:
          console.warn(`[TipTap Command]: Unknown command '${command}'`);
      }
    },
    [editorInstance, state.isReadOnly, setActiveCommentThread]
  );

  return {
    editorRef,
    editor: editorInstance,
    editorInstance,
    isReady,
    executeCommand,
  };
}
