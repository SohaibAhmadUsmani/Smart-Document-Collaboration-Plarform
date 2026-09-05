import { useEffect, useRef, useCallback } from 'react';
import { useCollaborationContext } from '../context/CollaborationContext.jsx';
import { COLLABORATION_EVENTS } from '../types/collaboration.js';
import { createPresenceDecorationPlugin, presenceDecorationKey } from '../presence/presenceDecorationPlugin.js';

/**
 * Real-time cursor & selection presence for a single document.
 *
 * Responsibilities:
 *  - Broadcast local cursor/selection changes to the `document:<id>` room.
 *  - Apply remote cursor/selection positions from the room as decorations in
 *    the shared TipTap editor (colored carets + highlighted selections).
 *
 * Purely collaboration data — nothing here is written to the database, and no
 * editor/persistence module is touched beyond registering one ProseMirror
 * decoration plugin onto the existing editor instance.
 *
 * @param {Object} options
 * @param {string|null} options.documentId - The document being collaborated on.
 * @param {Object|null} options.editor - The TipTap editor instance.
 * @param {string} options.userId - The local user's id (excluded from remote map).
 * @returns {{ remotePresence: Object[] }} The rendered remote positions.
 */
export function usePresencePosition({
  documentId,
  editor,
  userId,
} = {}) {
  const { socket, connected } = useCollaborationContext();

  /** userId → { userId, name, from, to } for OTHER users only. */
  const remotePositionsRef = useRef(new Map());
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const docIdRef = useRef(documentId);
  docIdRef.current = documentId;

  const lastSentRef = useRef(null);

  // ── Expose the live remote positions to the decoration plugin ─────────────
  const exposePositions = useCallback(() => {
    return Array.from(remotePositionsRef.current.values());
  }, []);

  // Force the ProseMirror view to recompute decorations after fresh data lands.
  const refreshDecorations = useCallback(() => {
    const ed = editorRef.current;
    if (ed?.view && typeof ed.view.dispatch === 'function') {
      ed.view.dispatch(ed.state.tr);
    }
  }, []);

  // ── Emit local cursor/selection changes (throttled) ───────────────────────
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || !socket || !connected || !docIdRef.current) return undefined;

    const sendPosition = () => {
      if (!socket?.connected) return;
      const { from, to } = ed.state.selection;
      if (from == null || to == null) return;
      if (lastSentRef.current === `${from}:${to}`) return;
      lastSentRef.current = `${from}:${to}`;

      const event =
        from === to
          ? COLLABORATION_EVENTS.CURSOR_CHANGE
          : COLLABORATION_EVENTS.SELECTION_CHANGE;
      socket.emit(event, {
        documentId: docIdRef.current,
        from,
        to,
      });
    };

    // Debounce heavy selection-churn (e.g. drag-select) to a single emit.
    let timer = null;
    const scheduleSend = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(sendPosition, 60);
    };

    ed.on('selectionUpdate', scheduleSend);
    ed.on('transaction', scheduleSend);

    return () => {
      if (timer) clearTimeout(timer);
      ed.off('selectionUpdate', scheduleSend);
      ed.off('transaction', scheduleSend);
    };
  }, [socket, connected, editor]);

  // ── Register the remote-decorations plugin on the editor ──────────────────
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return undefined;

    const plugin = createPresenceDecorationPlugin(exposePositions);
    ed.registerPlugin(plugin);

    return () => {
      // TipTap does not expose an unregister API on all versions; clear the
      // decorations by removing the plugin state and forcing a view redraw.
      const existing = presenceDecorationKey.get(ed.state);
      if (existing && ed.view?.dispatch) {
        ed.view.dispatch(ed.state.tr);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, exposePositions]);

  // ── Subscribe to remote cursor/selection packets for this document ────────
  useEffect(() => {
    if (!socket) return undefined;

    const mergeRemote = (payload) => {
      if (!docIdRef.current || payload.documentId !== docIdRef.current) return;
      if (!payload.userId || payload.userId === userId) return;

      const prev = remotePositionsRef.current.get(payload.userId);
      remotePositionsRef.current.set(payload.userId, {
        userId: payload.userId,
        name: payload.name || prev?.name || 'User',
        from: payload.from,
        to: payload.to,
      });
      refreshDecorations();
    };

    /**
     * Purges disconnected/inactive collaborators to eliminate ghost cursors.
     *
     * [ROMAN URDU]:
     * Jab presence update aati hai, jo users ab room mein active nahi hain unhe
     * `remotePositionsRef.current` se delete kar diya jata hai aur decorations
     * refresh ki jati hain taake screen par ghost cursors na bachein.
     */
    const handlePresenceUpdate = (payload) => {
      if (!docIdRef.current || payload.documentId !== docIdRef.current) return;

      const activeIds = new Set(
        (Array.isArray(payload.activeUsers) ? payload.activeUsers : []).map(
          (u) => String(u.userId || u.id)
        )
      );

      let changed = false;
      for (const uid of remotePositionsRef.current.keys()) {
        if (!activeIds.has(String(uid))) {
          remotePositionsRef.current.delete(uid);
          changed = true;
        }
      }

      if (changed) {
        refreshDecorations();
      }
    };

    socket.on(COLLABORATION_EVENTS.CURSOR_CHANGE, mergeRemote);
    socket.on(COLLABORATION_EVENTS.SELECTION_CHANGE, mergeRemote);
    socket.on(COLLABORATION_EVENTS.PRESENCE_UPDATE, handlePresenceUpdate);

    return () => {
      socket.off(COLLABORATION_EVENTS.CURSOR_CHANGE, mergeRemote);
      socket.off(COLLABORATION_EVENTS.SELECTION_CHANGE, mergeRemote);
      socket.off(COLLABORATION_EVENTS.PRESENCE_UPDATE, handlePresenceUpdate);
    };
  }, [socket, userId, refreshDecorations]);

  return {
    remotePresence: exposePositions(),
  };
}