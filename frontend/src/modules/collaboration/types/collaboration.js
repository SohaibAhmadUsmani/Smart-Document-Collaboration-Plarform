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
  /** Server → Client: active users in the current document room. */
  PRESENCE_UPDATE: 'collaboration:presence',
};

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
