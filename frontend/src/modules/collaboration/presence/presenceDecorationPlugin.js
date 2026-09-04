import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { presenceColorFor } from '../types/collaboration.js';

export const presenceDecorationKey = new PluginKey('collaborationPresenceDecorations');

/**
 * Build a ProseMirror plugin that renders remote collaborators' cursors and
 * selections as decorations over the shared TipTap editor.
 *
 * The plugin does not own any remote state; it reads the live positions from a
 * mutable source (`getPositions`) as it recomputes decorations on each editor
 * transaction. The hook drives an empty transaction whenever fresh presence
 * data arrives so the decorations re-render immediately.
 *
 * A remote entry shape is:
 *   {
 *     userId: string,
 *     name: string,
 *     color?: string,
 *     from: number|null,
 *     to: number|null,
 *   }
 *  - `from === to` (or `to == null`) renders a cursor caret widget.
 *  - `from < to` renders a highlighted selection inline decoration.
 *
 * @param {() => (Object[])} getPositions - Returns the current remote positions.
 * @returns {Plugin} A ProseMirror plugin ready to be registered on the editor.
 */
export function createPresenceDecorationPlugin(getPositions) {
  return new Plugin({
    key: presenceDecorationKey,
    props: {
      decorations(state) {
        const positions = getPositions();
        if (!positions || positions.length === 0) {
          return DecorationSet.empty;
        }

        let set = DecorationSet.empty;
        for (const p of positions) {
          const from = Number.isInteger(p?.from) ? p.from : null;
          const to = Number.isInteger(p?.to) ? p.to : null;
          if (from == null || to == null || from > state.doc.content.size) continue;

          const color = p.color || presenceColorFor(p.userId);

          if (to > from) {
            // Non-collapsed remote selection → highlight the selected range.
            set = set.add(state.doc, [
              Decoration.inline(from, Math.min(to, state.doc.content.size), {
                class: 'collab-remote-selection',
                style: `background-color: ${rgba(color, 0.28)}; box-shadow: 0 0 0 1px ${rgba(color, 0.6)} inset;`,
              }),
            ]);
          } else {
            // Collapsed cursor → render a caret widget plus a floating name tag.
            const widget = buildCursorWidget(p.name || 'User', color);
            const insertAt = Math.min(from, state.doc.content.size);
            set = set.add(state.doc, [
              Decoration.widget(insertAt, widget, { key: p.userId, side: -1 }),
            ]);
          }
        }
        return set;
      },
    },
  });
}

/**
 * Convert an `hsl(...)` color string into an `hsla(...)` at the given alpha.
 * @param {string} color
 * @param {number} alpha
 * @returns {string}
 */
function rgba(color, alpha) {
  return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
}

/**
 * Build the DOM element rendered for a remote cursor: a caret plus a name tag.
 * @param {string} name
 * @param {string} color
 * @returns {() => HTMLElement}
 */
function buildCursorWidget(name, color) {
  return () => {
    const container = document.createElement('span');
    container.className = 'collab-remote-cursor';
    container.style.position = 'absolute';

    const caret = document.createElement('span');
    caret.className = 'collab-remote-caret';
    caret.style.cssText = `display:inline-block;width:2px;height:1.15em;background:${color};margin-left:-1px;`;

    const tag = document.createElement('span');
    tag.className = 'collab-remote-tag';
    tag.textContent = String(name || '?').slice(0, 12);
    tag.style.cssText =
      `position:absolute;top:-1.1em;left:0;white-space:nowrap;font-size:10px;font-weight:600;` +
      `line-height:1.2;padding:0 4px;border-radius:3px;color:#fff;background:${color};` +
      `pointer-events:none;user-select:none;`;

    container.appendChild(caret);
    container.appendChild(tag);
    return container;
  };
}