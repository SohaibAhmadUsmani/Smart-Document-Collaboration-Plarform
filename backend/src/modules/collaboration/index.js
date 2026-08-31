/**
 * Collaboration Module — Backend Public API
 *
 * Provides Socket.IO server setup for real-time collaboration:
 * document rooms, live content synchronization and presence.
 */
export {
  initializeCollaboration,
  getIO,
} from './collaborationServer.js';
export {
  createPresenceStore,
} from './presenceStore.js';
export {
  COLLABORATION_EVENTS,
  documentRoomName,
  documentIdFromRoom,
} from './events.js';
