/**
 * Collaboration Module — Frontend Public API
 *
 * Provides the Socket.IO client, collaboration context, and the
 * useDocumentCollaboration hook used to mirror editor content in real time.
 */

export { COLLABORATION_EVENTS, documentRoomName, SOCKET_OPTIONS, presenceColorFor } from './types/collaboration.js';
export { getCollabSocket, disconnectCollabSocket, getCurrentUserId } from './services/socketClient.js';
export {
  CollaborationProvider,
  useCollaborationContext,
} from './context/CollaborationContext.jsx';
export { useDocumentCollaboration } from './hooks/useDocumentCollaboration.js';
export { usePresencePosition } from './hooks/usePresencePosition.js';
export { ActiveUsers } from './components/ActiveUsers.jsx';
