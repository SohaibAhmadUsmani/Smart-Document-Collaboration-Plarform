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

  // 1. Initialize TipTap Editor Instance
  useEffect(() => {
    if (!editorRef.current) return;

    const initialDoc = options.initialContent || state.content || { type: 'doc', content: [] };

    const editor = new Editor({
      element: editorRef.current,
      extensions: getEditorExtensions(options),
      content: initialDoc,
      editable: !state.isReadOnly,
      onUpdate: ({ editor: ed }) => {
        const json = ed.getJSON();
        const text = ed.getText();
        updateContent(json, text);

        // Update active marks and alignments
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
        };
        setActiveMarks(marks);
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
        };
        setActiveMarks(marks);
      },
    });

    setEditorInstance(editor);
    setIsReady(true);

    return () => {
      editor.destroy();
    };
  }, []);

  // 2. Reactive Content Synchronization (Handles Async Data & Template Loading)
  useEffect(() => {
    if (editorInstance && state.content) {
      const currentJSON = editorInstance.getJSON();
      const isDifferent = JSON.stringify(currentJSON) !== JSON.stringify(state.content);
      if (isDifferent && !editorInstance.isFocused) {
        editorInstance.commands.setContent(state.content, false);
      }
    }
  }, [state.content, editorInstance]);

  // 3. Update Editable State Dynamically
  useEffect(() => {
    if (editorInstance) {
      editorInstance.setEditable(!state.isReadOnly);
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
        case 'table':
          chain.insertTable({ rows: payload.rows || 3, cols: payload.cols || 3, withHeaderRow: true }).run();
          break;
        case 'insertComment': {
          const threadId = `cmt_anchor_${Date.now()}`;
          chain.setMark('commentMark', { commentThreadId: threadId, isActive: true }).run();
          if (setActiveCommentThread) setActiveCommentThread(threadId);
          break;
        }
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
