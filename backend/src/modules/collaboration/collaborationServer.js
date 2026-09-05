import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { createPresenceStore } from './presenceStore.js';
import { resolveDocumentAccess } from '../../middleware/documentPermissions.js';
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
        throw new Error('Authentication error: Invalid session token');
      }
    }
  }

  // Dev & Test fallback when no auth token is passed in non-production
  if (env.nodeEnv !== 'production') {
    return {
      id: 'mock-dev-user-id',
      name: 'User',
      email: 'dev@example.com',
      role: 'editor',
    };
  }

  throw new Error('Authentication error: Token is required');
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
  const user = socket.data?.user || { id: 'anonymous-user', name: 'User', role: 'viewer' };
  socket.data = socket.data || {};
  socket.data.documentIds = socket.data.documentIds || new Set();
  socket.data.docPermissions = socket.data.docPermissions || new Map();

  // Join the canonical document:<documentId> room.
  socket.on(COLLABORATION_EVENTS.JOIN_DOCUMENT, async (payload, ack) => {
    try {
      const documentId = String(payload?.documentId ?? '');
      if (!documentId) {
        if (typeof ack === 'function') ack({ ok: false, error: 'documentId is required' });
        return;
      }

      // Authorize document access when DB is connected and valid ObjectId
      let access = { allowed: true, canView: true, canEdit: true, role: user.role || 'editor' };
      if (mongoose.connection?.readyState === 1 && mongoose.isValidObjectId(documentId)) {
        access = await resolveDocumentAccess(user.id, documentId);
        if (!access.canView && !access.allowed) {
          console.warn(`[Collab Auth]: User ${user.id} denied access to join document ${documentId}`);
          if (typeof ack === 'function') ack({ ok: false, error: access.error || 'Access denied' });
          return;
        }
      }

      socket.data.docPermissions.set(documentId, access);
      socket.join(documentRoomName(documentId));
      socket.data.documentIds.add(documentId);
      presence.addMember(documentId, socket.id, {
        ...user,
        socketId: socket.id,
        role: access.role || user.role,
      });

      const members = presence.getMembers(documentId);
      if (typeof ack === 'function') {
        ack({
          ok: true,
          documentId,
          count: members.length,
          canEdit: access.canEdit,
          role: access.role || user.role,
        });
      }

      // Notify the whole room (including the newly joined user) of presence change.
      broadcastPresence(documentId);
    } catch (err) {
      console.error('[Collab Error]: JOIN_DOCUMENT failed:', err);
      if (typeof ack === 'function') ack({ ok: false, error: 'Internal collaboration error' });
    }
  });

  // Leave a document room.
  socket.on(COLLABORATION_EVENTS.LEAVE_DOCUMENT, (payload, ack) => {
    try {
      const documentId = String(payload?.documentId ?? '');
      if (!documentId) {
        if (typeof ack === 'function') ack({ ok: false, error: 'documentId is required' });
        return;
      }

      socket.leave(documentRoomName(documentId));
      socket.data.documentIds.delete(documentId);
      socket.data.docPermissions.delete(documentId);
      presence.removeMember(documentId, socket.id);

      const members = presence.getMembers(documentId);
      if (typeof ack === 'function') ack({ ok: true, documentId, count: members.length });

      broadcastPresence(documentId);
    } catch (err) {
      console.error('[Collab Error]: LEAVE_DOCUMENT failed:', err);
      if (typeof ack === 'function') ack({ ok: false, error: 'Internal collaboration error' });
    }
  });

  // Broadcast a content change to every OTHER socket in the document room.
  socket.on(COLLABORATION_EVENTS.CONTENT_CHANGE, (payload) => {
    try {
      const documentId = String(payload?.documentId ?? '');
      if (!documentId || !socket.data?.documentIds?.has(documentId)) return;

      const access = socket.data.docPermissions?.get(documentId);
      if (access && !access.canEdit) {
        console.warn(`[Collab Warning]: User ${user.id} attempted CONTENT_CHANGE without edit permission on ${documentId}`);
        return;
      }

      const senderName = user.name || 'User';
      socket.to(documentRoomName(documentId)).emit(COLLABORATION_EVENTS.CONTENT_CHANGE, {
        documentId,
        content: payload.content ?? null,
        plainText: payload.plainText ?? '',
        lastEditedBy: senderName,
        updatedBy: { userId: user.id, name: senderName },
      });
    } catch (err) {
      console.error('[Collab Error]: CONTENT_CHANGE failed:', err);
    }
  });

  // Broadcast a cursor position change to every OTHER member of the document room (rate limited to max 40Hz).
  let lastCursorBroadcast = 0;
  socket.on(COLLABORATION_EVENTS.CURSOR_CHANGE, (payload) => {
    try {
      const now = Date.now();
      if (now - lastCursorBroadcast < 25) return;
      lastCursorBroadcast = now;

      const documentId = String(payload?.documentId ?? '');
      if (!documentId || !socket.data?.documentIds?.has(documentId)) return;

      const from = Number.isInteger(payload?.from) && payload.from >= 0 ? payload.from : null;
      const to = Number.isInteger(payload?.to) && payload.to >= 0 ? payload.to : null;
      socket.to(documentRoomName(documentId)).emit(COLLABORATION_EVENTS.CURSOR_CHANGE, {
        documentId,
        userId: user.id,
        name: user.name || 'User',
        from,
        to,
      });
    } catch (err) {
      console.error('[Collab Error]: CURSOR_CHANGE failed:', err);
    }
  });

  // Broadcast a selection (non-collapsed range) change to every OTHER member of the document room (rate limited to max 40Hz).
  let lastSelectionBroadcast = 0;
  socket.on(COLLABORATION_EVENTS.SELECTION_CHANGE, (payload) => {
    try {
      const now = Date.now();
      if (now - lastSelectionBroadcast < 25) return;
      lastSelectionBroadcast = now;

      const documentId = String(payload?.documentId ?? '');
      if (!documentId || !socket.data?.documentIds?.has(documentId)) return;

      const from = Number.isInteger(payload?.from) && payload.from >= 0 ? payload.from : null;
      const to = Number.isInteger(payload?.to) && payload.to >= 0 ? payload.to : null;
      socket.to(documentRoomName(documentId)).emit(COLLABORATION_EVENTS.SELECTION_CHANGE, {
        documentId,
        userId: user.id,
        name: user.name || 'User',
        from,
        to,
      });
    } catch (err) {
      console.error('[Collab Error]: SELECTION_CHANGE failed:', err);
    }
  });

  // On disconnect, clean up presence for every document this socket had joined.
  socket.on('disconnect', (reason) => {
    console.log(`[Collaboration]: Client disconnected — socket ${socket.id} (${reason})`);
    const joined = Array.from(socket.data?.documentIds || []);
    for (const documentId of joined) {
      presence.removeMember(documentId, socket.id);
      broadcastPresence(documentId);
    }
    socket.data?.documentIds?.clear?.();
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
        if (!origin || env.allowedOrigins.includes(origin) || env.nodeEnv !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    try {
      const user = resolveUserFromHandshake(socket);
      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('unauthorized'));
    }
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
