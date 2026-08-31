import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getCollabSocket } from '../services/socketClient.js';

const CollaborationContext = createContext(null);

/**
 * Provides the shared Socket.IO connection and its live connection state to the
 * collaboration hooks and UI. Mounted once around the editor tree.
 *
 * @param {React.ReactNode} props.children
 */
export function CollaborationProvider({ children }) {
  const [socket] = useState(() => getCollabSocket());
  const [connected, setConnected] = useState(Boolean(socket?.connected));

  useEffect(() => {
    if (!socket) return undefined;

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  const contextValue = useMemo(
    () => ({ socket, connected }),
    [socket, connected]
  );

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
}

/**
 * Access the shared collaboration socket and its connection state.
 */
export function useCollaborationContext() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error(
      'useCollaborationContext must be used within a CollaborationProvider'
    );
  }
  return context;
}
