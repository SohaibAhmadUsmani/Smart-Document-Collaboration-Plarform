/**
 * @file CommentMark.js
 * @description ProseMirror Mark extension for highlighting inline text ranges linked to comment discussion threads.
 * Interoperates with Ayyan's Comments module via thread IDs.
 * @module frontend/src/modules/editor/extensions/marks/CommentMark
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh ProseMirror inline Mark extension hai jo highlighted text ko `<mark data-comment-thread-id="..."/>`
 * tag mein wrap karti hai. Ayyan ke comments module ke discussion thread ID ko attach karti hai.
 */

import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * Custom TipTap Mark for anchored inline comment discussions.
 *
 * [ROMAN URDU]:
 * TipTap Mark schema definition jo `commentThreadId` aur `isActive` attributes manage karti hai.
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
