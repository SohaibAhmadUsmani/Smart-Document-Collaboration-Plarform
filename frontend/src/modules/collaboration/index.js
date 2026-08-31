/**
 * Collaboration Module — Frontend Public API
 *
 * Provides the Socket.IO client, collaboration context, and the
 * useDocumentCollaboration hook used to mirror editor content in real time.
 */

export { COLLABORATION_EVENTS, documentRoomName, SOCKET_OPTIONS } from './types/collaboration.js';
export { getCollabSocket, disconnectCollabSocket } from './services/socketClient.js';
export {
  CollaborationProvider,
  useCollaborationContext,
} from './context/CollaborationContext.jsx';
export { useDocumentCollaboration } from './hooks/useDocumentCollaboration.js';
export { ActiveUsers } from './components/ActiveUsers.jsx';
