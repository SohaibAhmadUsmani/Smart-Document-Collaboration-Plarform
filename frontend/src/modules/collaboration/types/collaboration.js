/**
 * Collaboration Module — Shared event names and payload types.
 *
 * The exact Socket.IO room identifier for a document is:
 *   document:<documentId>
 */

export const COLLABORATION_EVENTS = {
  /** Client → Server: join the room for a document. Payload: { documentId } */
  JOIN_DOCUMENT: 'document:join',
  /** Client → Server: leave the room for a document. Payload: { documentId } */
  LEAVE_DOCUMENT: 'document:leave',
  /** Client ↔ Server: document content changed. Payload: { documentId, content, plainText } */
  CONTENT_CHANGE: 'document:change',
  /** Client ↔ Server: cursor position changed. Payload: { documentId, from, to } */
  CURSOR_CHANGE: 'document:cursor',
  /** Client ↔ Server: selection (non-collapsed) changed. Payload: { documentId, from, to } */
  SELECTION_CHANGE: 'document:selection',
  /** Server → Client: active users in the current document room. */
  PRESENCE_UPDATE: 'collaboration:presence',
};

/**
 * Deterministic color assigned to a collaborating user for cursor/selection
 * rendering. Stable per user id so the color does not flicker between renders.
 * @param {string} userId
 * @returns {string} An hsl color string.
 */
export function presenceColorFor(userId) {
  const palette = [
    'hsl(210, 90%, 45%)',
    'hsl(150, 70%, 35%)',
    'hsl(0, 75%, 50%)',
    'hsl(265, 70%, 50%)',
    'hsl(20, 85%, 48%)',
    'hsl(320, 75%, 45%)',
    'hsl(180, 75%, 35%)',
    'hsl(50, 85%, 42%)',
  ];
  const hash = `${userId}`.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

/**
 * Build the canonical Socket.IO room name for a document.
 * @param {string} documentId
 * @returns {string}
 */
export function documentRoomName(documentId) {
  return `document:${documentId}`;
}

/**
 * The Socket.IO reconnection options used by the collaboration client.
 */
export const SOCKET_OPTIONS = {
  path: '/socket.io',
  autoConnect: true,
  reconnection: true,
  transports: ['websocket', 'polling'],
};
