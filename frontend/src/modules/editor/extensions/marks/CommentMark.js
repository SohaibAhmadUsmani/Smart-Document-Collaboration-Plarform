import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * ProseMirror Mark representing anchored inline comment discussions.
 */
export const CommentMark = Mark.create({
  name: 'commentMark',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      commentThreadId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-thread-id'),
        renderHTML: (attributes) => {
          if (!attributes.commentThreadId) return {};
          return {
            'data-comment-thread-id': attributes.commentThreadId,
          };
        },
      },
      isActive: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-comment-active') === 'true',
        renderHTML: (attributes) => ({
          'data-comment-active': attributes.isActive ? 'true' : 'false',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mark[data-comment-thread-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'mark',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-editor-mark': 'comment',
      }),
      0,
    ];
  },
});
