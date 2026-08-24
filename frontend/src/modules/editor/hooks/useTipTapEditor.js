import { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@tiptap/core';
import { getEditorExtensions } from '../extensions/schema.js';
import { useDocumentEditor } from './useDocumentEditor.js';
import { extractPlainTextFromAst } from '../utils/astConverters.js';

/**
 * Headless TipTap editor integration hook.
 * Mounts editor instance onto a DOM element ref and syncs state to context.
 */
export function useTipTapEditor(options = {}) {
  const { state, updateContent, setActiveMarks } = useDocumentEditor();
  const editorRef = useRef(null);
  const [editorInstance, setEditorInstance] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = new Editor({
      element: editorRef.current,
      extensions: getEditorExtensions(options),
      content: state.content || { type: 'doc', content: [] },
      editable: !state.isReadOnly,
      onUpdate: ({ editor: ed }) => {
        const json = ed.getJSON();
        const text = ed.getText();
        updateContent(json, text);

        // Update active marks
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
          blockquote: ed.isActive('blockquote'),
          codeBlock: ed.isActive('codeBlock'),
          table: ed.isActive('table'),
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
          blockquote: ed.isActive('blockquote'),
          codeBlock: ed.isActive('codeBlock'),
          table: ed.isActive('table'),
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

  // Update editable state dynamically
  useEffect(() => {
    if (editorInstance) {
      editorInstance.setEditable(!state.isReadOnly);
    }
  }, [state.isReadOnly, editorInstance]);

  // Execute formatting command on editor
  const executeCommand = useCallback(
    (command, payload = {}) => {
      if (!editorInstance || state.isReadOnly) return;

      const chain = editorInstance.chain().focus();

      switch (command) {
        case 'bold':
          chain.toggleBold().run();
          break;
        case 'italic':
          chain.toggleItalic().run();
          break;
        case 'underline':
          chain.toggleUnderline().run();
          break;
        case 'strike':
          chain.toggleStrike().run();
          break;
        case 'code':
          chain.toggleCode().run();
          break;
        case 'heading':
          chain.toggleHeading({ level: payload.level || 1 }).run();
          break;
        case 'paragraph':
          chain.setParagraph().run();
          break;
        case 'bulletList':
          chain.toggleBulletList().run();
          break;
        case 'orderedList':
          chain.toggleOrderedList().run();
          break;
        case 'taskList':
          chain.toggleTaskList().run();
          break;
        case 'blockquote':
          chain.toggleBlockquote().run();
          break;
        case 'codeBlock':
          chain.toggleCodeBlock({ language: payload.language || 'plaintext' }).run();
          break;
        case 'horizontalRule':
          chain.setHorizontalRule().run();
          break;
        case 'table':
          chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          break;
        default:
          console.warn(`[TipTap] Unknown command '${command}'`);
      }
    },
    [editorInstance, state.isReadOnly]
  );

  return {
    editorRef,
    editor: editorInstance,
    isReady,
    executeCommand,
  };
}
