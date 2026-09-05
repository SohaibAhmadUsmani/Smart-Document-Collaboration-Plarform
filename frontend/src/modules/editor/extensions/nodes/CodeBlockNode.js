/**
 * @file CodeBlockNode.js
 * @description ProseMirror block node extension for preformatted code blocks with syntax highlighting language tags.
 * @module frontend/src/modules/editor/extensions/nodes/CodeBlockNode
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh custom ProseMirror block node hai jo \<pre><code class="language-..."/>\ structure
 * render karta hai. Multi-line code snippets aur syntax highlighting ke liye use hota hai.
 */

import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Custom Preformatted Code Block Node.
 *
 * [ROMAN URDU]:
 * TipTap Node schema jo language (jaise javascript, python, html, plaintext) aur unique blockId ko track karta hai.
 * Yeh cleanly `<pre><code class="language-..."/>` render karta hai bina dual ProseMirror instance issues ke.
 */
export const CodeBlockNode = Node.create({
  name: 'codeBlock',
  group: 'block',
  content: 'text*',
  marks: '',
  code: true,
  defining: true,

  addAttributes() {
    return {
      language: {
        default: 'plaintext',
        parseHTML: (element) => element.getAttribute('data-language') || 'plaintext',
        renderHTML: (attributes) => ({
          'data-language': attributes.language,
        }),
      },
      blockId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-block-id'),
        renderHTML: (attributes) => ({
          'data-block-id': attributes.blockId,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'pre' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(HTMLAttributes, { 'data-editor-node': 'code-block' }),
      ['code', { class: `language-${HTMLAttributes['data-language'] || 'plaintext'}` }, 0],
    ];
  },
});
