import { io } from 'socket.io-client';
import { SOCKET_OPTIONS } from '../types/collaboration.js';

let socket = null;

/**
 * Return the shared socket.io-client instance.
 *
 * Created lazily as a singleton so the whole app shares one connection to the
 * backend instead of opening a new socket per consumer. The JWT token (used by
 * the existing API layer) is passed through the handshake so the collaboration
 * server can resolve the collaborating user's identity.
 *
 * @returns {import('socket.io-client').Socket}
 */
export function getCollabSocket() {
  if (socket) return socket;

  const token =
    (typeof localStorage !== 'undefined' && localStorage.getItem('token')) ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('token'));

  const options = { ...SOCKET_OPTIONS };
  if (token) {
    options.auth = { token };
  }

  // Allow an explicit socket URL (e.g. VITE_SOCKET_URL) for deployments where
  // the socket is served from a different origin. Otherwise connect to the
  // current origin with the /socket.io path (dev is proxied by Vite).
  const url = import.meta.env?.VITE_SOCKET_URL || undefined;

  socket = url ? io(url, options) : io(options);
  return socket;
}

/**
 * Disconnect and release the shared socket instance.
 */
export function disconnectCollabSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
