/**
 * Collaboration Module — In-memory presence store.
 *
 * Tracks which users are currently connected to each document room so the
 * collaboration server can report active users and broadcast presence to the
 * room. This store is intentionally in-memory (no database writes on every
 * keystroke) and stays decoupled from document persistence.
 */
export function createPresenceStore() {
  /** documentId → Map(socketId → user) */
  const rooms = new Map();

  /**
   * Add a member to a document room.
   * @param {string} documentId
   * @param {string} socketId
   * @param {Object} user - { id, name, email, role }
   */
  function addMember(documentId, socketId, user) {
    if (!rooms.has(documentId)) {
      rooms.set(documentId, new Map());
    }
    rooms.get(documentId).set(socketId, user);
  }

  /**
   * Remove a member from a document room.
   * Returns the removed user, or null if the member did not exist.
   * @param {string} documentId
   * @param {string} socketId
   * @returns {Object|null}
   */
  function removeMember(documentId, socketId) {
    const room = rooms.get(documentId);
    if (!room) return null;
    const removedUser = room.get(socketId) || null;
    room.delete(socketId);
    if (room.size === 0) {
      rooms.delete(documentId);
    }
    return removedUser;
  }

  /**
   * List current members of a document room.
   * @param {string} documentId
   * @returns {Object[]}
   */
  function getMembers(documentId) {
    const room = rooms.get(documentId);
    if (!room) return [];
    return Array.from(room.values());
  }

  /**
   * Number of current members in a document room.
   * @param {string} documentId
   * @returns {number}
   */
  function getMemberCount(documentId) {
    const room = rooms.get(documentId);
    return room ? room.size : 0;
  }

  /**
   * List all documentIds that currently have members.
   * @returns {string[]}
   */
  function listRooms() {
    return Array.from(rooms.keys());
  }

  return {
    addMember,
    removeMember,
    getMembers,
    getMemberCount,
    listRooms,
  };
}
