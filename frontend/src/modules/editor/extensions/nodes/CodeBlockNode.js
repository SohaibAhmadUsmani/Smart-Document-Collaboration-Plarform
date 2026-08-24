import { Node, mergeAttributes } from '@tiptap/core';

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
