/**
 * Collaboration Module — Shared event names.
 *
 * The exact Socket.IO room identifier for a document is:
 *   document:<documentId>
 *
 * All users editing the same document must join the same room.
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
 * Build the canonical Socket.IO room name for a document.
 * @param {string} documentId
 * @returns {string}
 */
export function documentRoomName(documentId) {
  return `document:${documentId}`;
}

/**
 * Extract a documentId from a room name, or null if it is not a document room.
 * @param {string} roomName
 * @returns {string|null}
 */
export function documentIdFromRoom(roomName) {
  const prefix = 'document:';
  if (typeof roomName === 'string' && roomName.startsWith(prefix)) {
    return roomName.slice(prefix.length);
  }
  return null;
}
