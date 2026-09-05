/**
 * @file FontFamilyMark.js
 * @description ProseMirror Mark extension for applying custom font families to inline text.
 * Allows switching between 10-15 Google & system fonts in the DocSync Pro editor.
 * @module frontend/src/modules/editor/extensions/marks/FontFamilyMark
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh TipTap inline Mark extension hai jo selected text par custom font family style apply karti hai.
 * Document editor mein 10 se 15 mukhtalif fonts (Inter, Roboto, Poppins, Playfair Display waghera)
 * ko smooth format karne ki sahulat deti hai.
 */

import { Mark, mergeAttributes } from '@tiptap/core';

export const FontFamilyMark = Mark.create({
  name: 'fontFamily',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily?.replace(/['"]/g, ''),
        renderHTML: (attributes) => {
          if (!attributes.fontFamily) {
            return {};
          }
          return {
            style: `font-family: '${attributes.fontFamily}', sans-serif`,
            'data-font-family': attributes.fontFamily,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        style: 'font-family',
      },
      {
        tag: 'span[data-font-family]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily) =>
        ({ chain }) => {
          if (!fontFamily || fontFamily === 'Default' || fontFamily === 'Inter') {
            return chain().unsetMark(this.name).run();
          }
          return chain().setMark(this.name, { fontFamily }).run();
        },
      unsetFontFamily:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },
});
