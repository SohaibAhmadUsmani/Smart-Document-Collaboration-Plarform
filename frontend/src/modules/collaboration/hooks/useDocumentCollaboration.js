import { useEffect, useRef, useState, useCallback } from 'react';
import { useCollaborationContext } from '../context/CollaborationContext.jsx';
import { COLLABORATION_EVENTS } from '../types/collaboration.js';

/**
 * Real-time collaboration for a single document editor.
 *
 * Responsibilities (collaboration milestone):
 *  - Join/leave the `document:<documentId>` Socket.IO room.
 *  - Broadcast local editor content changes to the room.
 *  - Apply remote content changes received from the room into the editor.
 *  - Track active users (presence) for the open document.
 *
 * INTEGRATION NOTES
 *  - Persistence stays with the existing autosave (owned by the Documents/Editor
 *    module). This hook only mirrors content over Socket.IO and never touches
 *    the database.
 *  - Echo/loop prevention is two fold:
 *      1. The server broadcasts to "everyone but the sender", so a user never
 *         receives their own change back over the wire.
 *      2. On the client, changes that were applied from a remote packet are
 *         flagged with `isApplyingRemoteRef` so they are not re-broadcast, and
 *         duplicate dispatches are de-duplicated by content value
 *         (`lastSeenContentRef`). This prevents remote-update rebroadcast and
 *         infinite update loops even after TipTap's onUpdate re-dispatches.
 *
 * @param {Object} options
 * @param {string|null} options.documentId - The document to collaborate on.
 * @param {Object|null} options.editor - The TipTap editor instance.
 * @param {Object|null} options.content - Current TipTap JSON AST (editor state).
 * @param {string} options.plainText - Current plain text (editor state).
 * @returns {Object} { connected, activeUsers, presenceCount, applyRemoteContent, broadcastChange }
 */
export function useDocumentCollaboration({
  documentId,
  editor,
  content,
  plainText = '',
} = {}) {
  const { socket, connected } = useCollaborationContext();

  const [activeUsers, setActiveUsers] = useState([]);
  const [presenceCount, setPresenceCount] = useState(0);

  const editorRef = useRef(editor);
  editorRef.current = editor;

  const documentIdRef = useRef(documentId);
  documentIdRef.current = documentId;

  const isApplyingRemoteRef = useRef(false);
  const lastSeenContentRef = useRef(null);
  const readyToEmitRef = useRef(false);

  // ── Apply a remote content update into the existing editor ────────────────
  const applyRemoteContent = useCallback((remoteContent, remotePlainText) => {
    isApplyingRemoteRef.current = true;
    const ed = editorRef.current;
    if (ed) {
      // setContent triggers the editor's onUpdate -> existing UPDATE_CONTENT
      // flow, keeping editor + autosave state in sync.
      ed.commands.setContent(remoteContent, false);
      // Safety: if setContent produced no real change the content-watch effect
      // may never run to clear the flag, so clear it on the next tick as well.
      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 0);
    }
    // With no live editor yet the remote change is skipped; the document's
    // initial content is hydrated by the editor's own load flow regardless.
    void remotePlainText;
  }, []);

  // ── Content-watch: broadcast local changes, ignore remote-applied ones ────
  useEffect(() => {
    const contentStr = content ? JSON.stringify(content) : null;

    // De-duplicate identical content (e.g. onUpdate re-dispatch after a remote
    // setContent applies the same value).
    if (contentStr === lastSeenContentRef.current) return;
    lastSeenContentRef.current = contentStr;

    // A change that was applied from a remote packet must not be re-broadcast.
    if (isApplyingRemoteRef.current) {
      isApplyingRemoteRef.current = false;
      return;
    }

    // Only broadcast after the document's initial content has been observed
    // (the initial load must not be sent to the room).
    if (readyToEmitRef.current && socket && connected && documentId) {
      socket.emit(COLLABORATION_EVENTS.CONTENT_CHANGE, {
        documentId,
        content,
        plainText,
      });
    }
    readyToEmitRef.current = true;
  }, [content, plainText, socket, connected, documentId]);

  // ── Subscribe to remote content + presence for the current document ───────
  useEffect(() => {
    if (!socket) return undefined;

    const handleRemoteChange = (payload) => {
      if (!documentIdRef.current || payload.documentId !== documentIdRef.current) {
        return;
      }
      applyRemoteContent(payload.content, payload.plainText);
    };

    const handlePresence = (payload) => {
      if (!documentIdRef.current || payload.documentId !== documentIdRef.current) {
        return;
      }
      setActiveUsers(Array.isArray(payload.activeUsers) ? payload.activeUsers : []);
      setPresenceCount(Number.isFinite(payload.count) ? payload.count : 0);
    };

    socket.on(COLLABORATION_EVENTS.CONTENT_CHANGE, handleRemoteChange);
    socket.on(COLLABORATION_EVENTS.PRESENCE_UPDATE, handlePresence);

    return () => {
      socket.off(COLLABORATION_EVENTS.CONTENT_CHANGE, handleRemoteChange);
      socket.off(COLLABORATION_EVENTS.PRESENCE_UPDATE, handlePresence);
    };
  }, [socket, applyRemoteContent]);

  // Join the room when connected + documentId; leave on change/unmount.
  useEffect(() => {
    if (!socket || !connected || !documentId) return undefined;

    socket.emit(COLLABORATION_EVENTS.JOIN_DOCUMENT, { documentId });
    readyToEmitRef.current = false;
    lastSeenContentRef.current = content ? JSON.stringify(content) : null;

    return () => {
      if (socket) {
        socket.emit(COLLABORATION_EVENTS.LEAVE_DOCUMENT, { documentId });
      }
      readyToEmitRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, connected, documentId]);

  /**
   * Manually broadcast a document's content to the room (used by the editor
   * integration when the change originated from a non-content action such as a
   * remote title/setContent flow if ever needed).
   */
  const broadcastChange = useCallback(
    (contentToSend, textToSend) => {
      if (!socket || !connected || !documentIdRef.current) return;
      socket.emit(COLLABORATION_EVENTS.CONTENT_CHANGE, {
        documentId: documentIdRef.current,
        content: contentToSend,
        plainText: textToSend,
      });
    },
    [socket, connected]
  );

  return {
    connected,
    activeUsers,
    presenceCount,
    applyRemoteContent,
    broadcastChange,
  };
}
