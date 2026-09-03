import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { createPresenceStore } from './presenceStore.js';
import {
  COLLABORATION_EVENTS,
  documentRoomName,
} from './events.js';

let io = null;
const presence = createPresenceStore();

/**
 * Resolve the collaborating user from the Socket.IO handshake.
 *
 * Mirrors the Express authentication contract (backend/src/middleware/auth.js):
 * accepts a JWT delivered through the socket handshake `auth.token` or an
 * `Authorization: Bearer <token>` header, and falls back to the seeded dev
 * user when no valid token is present (development mode).
 *
 * @param {import('socket.io').Socket} socket
 * @returns {{ id: string, name: string, email?: string, role?: string }}
 */
function resolveUserFromHandshake(socket) {
  const authorization = socket.handshake?.headers?.authorization;
  const authToken =
    socket.handshake?.auth?.token ||
    (typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : null);

  if (authToken && env.jwtSecret) {
    try {
      const decoded = jwt.verify(authToken, env.jwtSecret);
      const id = String(decoded.id || decoded._id || decoded.userId || '');
      if (id) {
        return {
          id,
          name: decoded.name || decoded.email || 'User',
          email: decoded.email,
          role: decoded.role || 'editor',
        };
      }
    } catch (err) {
      if (env.nodeEnv === 'production') {
        console.warn('[Collaboration Auth]: Invalid token:', err.message);
      }
    }
  }

  // Development fallback user — matches the seeded user in seedDatabase.js
  return {
    id: '66cc00000000000000000004',
    name: 'Muzammil (Document Editor Lead)',
    email: 'muzammil@docplatform.local',
    role: 'owner',
  };
}

/**
 * Broadcast the current list of active users for a document to its room.
 * @param {string} documentId
 */
function broadcastPresence(documentId) {
  if (!io) return;
  const room = documentRoomName(documentId);
  const members = presence.getMembers(documentId).map((m) => ({
    userId: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    socketId: m.socketId,
  }));
  io.to(room).emit(COLLABORATION_EVENTS.PRESENCE_UPDATE, {
    documentId,
    count: members.length,
    activeUsers: members,
  });
}

/**
 * Register per-socket collaboration event handlers.
 * @param {import('socket.io').Socket} socket
 */
function registerSocketHandlers(socket) {
  const user = resolveUserFromHandshake(socket);
  socket.data.user = user;
  socket.data.documentIds = new Set();

  // Join the canonical document:<documentId> room.
  socket.on(COLLABORATION_EVENTS.JOIN_DOCUMENT, (payload, ack) => {
    const documentId = String(payload?.documentId ?? '');
    if (!documentId) {
      if (typeof ack === 'function') ack({ ok: false, error: 'documentId is required' });
      return;
    }

    socket.join(documentRoomName(documentId));
    socket.data.documentIds.add(documentId);
    presence.addMember(documentId, socket.id, { ...user, socketId: socket.id });

    const members = presence.getMembers(documentId);
    if (typeof ack === 'function') ack({ ok: true, documentId, count: members.length });

    // Notify the whole room (including the newly joined user) of presence change.
    broadcastPresence(documentId);
  });

  // Leave a document room.
  socket.on(COLLABORATION_EVENTS.LEAVE_DOCUMENT, (payload, ack) => {
    const documentId = String(payload?.documentId ?? '');
    if (!documentId) {
      if (typeof ack === 'function') ack({ ok: false, error: 'documentId is required' });
      return;
    }

    socket.leave(documentRoomName(documentId));
    socket.data.documentIds.delete(documentId);
    presence.removeMember(documentId, socket.id);

    const members = presence.getMembers(documentId);
    if (typeof ack === 'function') ack({ ok: true, documentId, count: members.length });

    broadcastPresence(documentId);
  });

  // Broadcast a content change to every OTHER socket in the document room.
  // The sender is deliberately excluded (socket.to) so it never receives its
  // own update back, avoiding echo/rebroadcast loops.
  socket.on(COLLABORATION_EVENTS.CONTENT_CHANGE, (payload) => {
    const documentId = String(payload?.documentId ?? '');
    if (!documentId || !socket.data.documentIds.has(documentId)) return;

    const senderName = user.name || 'User';
    socket.to(documentRoomName(documentId)).emit(COLLABORATION_EVENTS.CONTENT_CHANGE, {
      documentId,
      content: payload.content ?? null,
      plainText: payload.plainText ?? '',
      lastEditedBy: senderName,
      updatedBy: { userId: user.id, name: senderName },
    });
  });

  // Broadcast a cursor position change to every OTHER member of the document
  // room. The sender is excluded (socket.to) so it never receives its own
  // cursor back, mirroring the content-change exclusion.
  socket.on(COLLABORATION_EVENTS.CURSOR_CHANGE, (payload) => {
    const documentId = String(payload?.documentId ?? '');
    if (!documentId || !socket.data.documentIds.has(documentId)) return;

    const from = Number.isInteger(payload?.from) ? payload.from : null;
    const to = Number.isInteger(payload?.to) ? payload.to : null;
    socket.to(documentRoomName(documentId)).emit(COLLABORATION_EVENTS.CURSOR_CHANGE, {
      documentId,
      userId: user.id,
      name: user.name || 'User',
      from,
      to,
    });
  });

  // Broadcast a selection (non-collapsed range) change to every OTHER member of
  // the document room. Sender-excluded, same as cursor/content broadcasts.
  socket.on(COLLABORATION_EVENTS.SELECTION_CHANGE, (payload) => {
    const documentId = String(payload?.documentId ?? '');
    if (!documentId || !socket.data.documentIds.has(documentId)) return;

    const from = Number.isInteger(payload?.from) ? payload.from : null;
    const to = Number.isInteger(payload?.to) ? payload.to : null;
    socket.to(documentRoomName(documentId)).emit(COLLABORATION_EVENTS.SELECTION_CHANGE, {
      documentId,
      userId: user.id,
      name: user.name || 'User',
      from,
      to,
    });
  });

  // On disconnect, clean up presence for every document this socket had joined.
  socket.on('disconnect', (reason) => {
    console.log(`[Collaboration]: Client disconnected — socket ${socket.id} (${reason})`);
    const joined = Array.from(socket.data.documentIds || []);
    for (const documentId of joined) {
      presence.removeMember(documentId, socket.id);
      broadcastPresence(documentId);
    }
    socket.data.documentIds.clear();
  });
}

/**
 * Initialize Socket.IO server attached to the existing HTTP server.
 * CORS mirrors the Express app configuration in app.js.
 *
 * @param {import('http').Server} httpServer - The Node HTTP server created in server.js
 * @returns {Server} The Socket.IO server instance
 */
export function initializeCollaboration(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin === env.clientOrigin) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log(`[Collaboration]: Client connected — socket ${socket.id}`);
    registerSocketHandlers(socket);
  });

  console.log('[Collaboration]: Socket.IO server initialized');
  return io;
}

/**
 * Return the active Socket.IO server instance.
 * Returns null if initializeCollaboration has not been called yet.
 */
export function getIO() {
  return io;
}
