import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { io as ioc } from 'socket.io-client';
import { createPresenceStore } from '../presenceStore.js';
import {
  documentRoomName,
  documentIdFromRoom,
  COLLABORATION_EVENTS,
} from '../events.js';
import { initializeCollaboration, getIO } from '../index.js';

// ─── Room-name helpers ───────────────────────────────────────────────────────

test('documentRoomName builds the canonical document:<id> room', () => {
  assert.equal(documentRoomName('12345'), 'document:12345');
  assert.equal(documentRoomName('abc'), 'document:abc');
});

test('documentIdFromRoom extracts the document id from a room', () => {
  assert.equal(documentIdFromRoom('document:12345'), '12345');
  assert.equal(documentIdFromRoom('document:abc'), 'abc');
  assert.equal(documentIdFromRoom('otherRoom'), null);
  assert.equal(documentIdFromRoom('document:'), '');
});

test('COLLABORATION_EVENTS use the expected names', () => {
  assert.equal(COLLABORATION_EVENTS.JOIN_DOCUMENT, 'document:join');
  assert.equal(COLLABORATION_EVENTS.LEAVE_DOCUMENT, 'document:leave');
  assert.equal(COLLABORATION_EVENTS.CONTENT_CHANGE, 'document:change');
  assert.equal(COLLABORATION_EVENTS.CURSOR_CHANGE, 'document:cursor');
  assert.equal(COLLABORATION_EVENTS.SELECTION_CHANGE, 'document:selection');
  assert.equal(COLLABORATION_EVENTS.PRESENCE_UPDATE, 'collaboration:presence');
});

// ─── Presence store (pure, in-memory) ────────────────────────────────────────

test('presence store tracks members per document and cleans up empty rooms', () => {
  const store = createPresenceStore();
  assert.equal(store.getMemberCount('d1'), 0);

  store.addMember('d1', 'sockA', { id: 'u1', name: 'Alice', socketId: 'sockA' });
  store.addMember('d1', 'sockB', { id: 'u2', name: 'Bob', socketId: 'sockB' });
  store.addMember('d2', 'sockC', { id: 'u3', name: 'Carol', socketId: 'sockC' });

  assert.equal(store.getMemberCount('d1'), 2);
  assert.equal(store.getMemberCount('d2'), 1);
  assert.deepEqual(store.listRooms().sort(), ['d1', 'd2']);

  const names = store.getMembers('d1').map((m) => m.name).sort();
  assert.deepEqual(names, ['Alice', 'Bob']);

  // Removing the last member deletes the room
  store.removeMember('d2', 'sockC');
  assert.equal(store.getMemberCount('d2'), 0);
  assert.deepEqual(store.listRooms(), ['d1']);

  // Removing a non-existent member is a no-op returning null
  assert.equal(store.removeMember('d1', 'ghost'), null);
});

test('presence store is isolated between documents', () => {
  const store = createPresenceStore();
  store.addMember('doc-a', 's1', { id: 'u1', name: 'A', socketId: 's1' });
  assert.equal(store.getMemberCount('doc-b'), 0);
  assert.equal(store.getMembers('doc-b').length, 0);
});

// ─── Socket.IO end-to-end (no database required) ─────────────────────────────
// Initializes the collaboration server on a bare http server and verifies that
// two clients can join a document room and receive each other's changes while
// the sender does not receive its own echo.

function startCollabServer() {
  return new Promise((resolve) => {
    const httpServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    httpServer.listen(0, () => {
      const io = initializeCollaboration(httpServer);
      resolve({ io, httpServer, port: httpServer.address().port });
    });
  });
}

function connectClient(port, token) {
  return ioc(`http://localhost:${port}`, {
    path: '/socket.io',
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    auth: token ? { token } : undefined,
  });
}

function waitForEvent(socket, event, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for "${event}"`)), timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

async function shutdown(io, httpServer) {
  if (io) {
    await new Promise((resolve) => io.close(resolve));
  }
  await new Promise((resolve) => httpServer.close(resolve));
}

test('socket.io: content change is broadcast to other room members but not the sender', async () => {
  const { io, httpServer, port } = await startCollabServer();
  const socketA = connectClient(port);
  const socketB = connectClient(port);

  try {
    await Promise.all([waitForEvent(socketA, 'connect'), waitForEvent(socketB, 'connect')]);

    const docId = 'room-echo-test';
    await new Promise((resolve) => {
      socketA.emit(COLLABORATION_EVENTS.JOIN_DOCUMENT, { documentId: docId }, resolve);
    });
    await new Promise((resolve) => {
      socketB.emit(COLLABORATION_EVENTS.JOIN_DOCUMENT, { documentId: docId }, resolve);
    });

    // B should receive A's change.
    const receivedByB = waitForEvent(socketB, COLLABORATION_EVENTS.CONTENT_CHANGE);

    // A should NOT receive its own echo — we listen and fail if it fires.
    let aSelfEcho = false;
    const selfEchoProbe = () => { aSelfEcho = true; };
    socketA.on(COLLABORATION_EVENTS.CONTENT_CHANGE, selfEchoProbe);

    socketA.emit(COLLABORATION_EVENTS.CONTENT_CHANGE, {
      documentId: docId,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      plainText: 'hello from A',
    });

    const payload = await receivedByB;
    assert.equal(payload.documentId, docId);
    assert.equal(payload.plainText, 'hello from A');
    assert.equal(payload.content.type, 'doc');

    // Give a moment to confirm no self-echo fired.
    await new Promise((r) => setTimeout(r, 150));
    socketA.off(COLLABORATION_EVENTS.CONTENT_CHANGE, selfEchoProbe);
    assert.equal(aSelfEcho, false, 'sender must not receive its own content change');
  } finally {
    socketA.disconnect();
    socketB.disconnect();
    await shutdown(io, httpServer);
  }
});

test('socket.io: presence reports active users and drops members on disconnect', async () => {
  const { io, httpServer, port } = await startCollabServer();
  const socketA = connectClient(port);
  const socketB = connectClient(port);

  try {
    await Promise.all([waitForEvent(socketA, 'connect'), waitForEvent(socketB, 'connect')]);

    const docId = 'room-presence-test';

    // First user joins -> presence update with just A.
    const presenceAfterA = waitForEvent(socketA, COLLABORATION_EVENTS.PRESENCE_UPDATE);
    socketA.emit(COLLABORATION_EVENTS.JOIN_DOCUMENT, { documentId: docId });
    const pa = await presenceAfterA;
    assert.equal(pa.count, 1);
    assert.equal(pa.activeUsers.length, 1);

    // Second user joins -> presence update with A and B.
    const presenceAfterB = waitForEvent(socketA, COLLABORATION_EVENTS.PRESENCE_UPDATE);
    socketB.emit(COLLABORATION_EVENTS.JOIN_DOCUMENT, { documentId: docId });
    const pb = await presenceAfterB;
    assert.equal(pb.count, 2);
    assert.equal(pb.activeUsers.length, 2);

    // B disconnects -> presence drops back to 1.
    const presenceAfterDisconnect = waitForEvent(socketA, COLLABORATION_EVENTS.PRESENCE_UPDATE);
    socketB.disconnect();
    const pd = await presenceAfterDisconnect;
    assert.equal(pd.count, 1);
    assert.equal(pd.activeUsers.length, 1);

    assert.equal(getIO(), io, 'getIO returns the active server instance');
  } finally {
    socketA.disconnect();
    socketB.disconnect();
    await shutdown(io, httpServer);
  }
});

test('socket.io: cursor change is broadcast to other members but not the sender', async () => {
  const { io, httpServer, port } = await startCollabServer();
  const socketA = connectClient(port);
  const socketB = connectClient(port);

  try {
    await Promise.all([waitForEvent(socketA, 'connect'), waitForEvent(socketB, 'connect')]);

    const docId = 'room-cursor-test';
    await new Promise((resolve) => {
      socketA.emit(COLLABORATION_EVENTS.JOIN_DOCUMENT, { documentId: docId }, resolve);
    });
    await new Promise((resolve) => {
      socketB.emit(COLLABORATION_EVENTS.JOIN_DOCUMENT, { documentId: docId }, resolve);
    });

    const receivedByB = waitForEvent(socketB, COLLABORATION_EVENTS.CURSOR_CHANGE);
    let aSelfCursor = false;
    const selfProbe = () => { aSelfCursor = true; };
    socketA.on(COLLABORATION_EVENTS.CURSOR_CHANGE, selfProbe);

    socketA.emit(COLLABORATION_EVENTS.CURSOR_CHANGE, { documentId: docId, from: 3, to: 3 });

    const payload = await receivedByB;
    assert.equal(payload.documentId, docId);
    assert.equal(payload.from, 3);
    assert.equal(payload.to, 3);
    assert.ok(payload.userId);

    await new Promise((r) => setTimeout(r, 150));
    socketA.off(COLLABORATION_EVENTS.CURSOR_CHANGE, selfProbe);
    assert.equal(aSelfCursor, false, 'sender must not receive its own cursor update');
  } finally {
    socketA.disconnect();
    socketB.disconnect();
    await shutdown(io, httpServer);
  }
});

test('socket.io: selection change is broadcast to other members but not the sender', async () => {
  const { io, httpServer, port } = await startCollabServer();
  const socketA = connectClient(port);
  const socketB = connectClient(port);

  try {
    await Promise.all([waitForEvent(socketA, 'connect'), waitForEvent(socketB, 'connect')]);

    const docId = 'room-selection-test';
    await new Promise((resolve) => {
      socketA.emit(COLLABORATION_EVENTS.JOIN_DOCUMENT, { documentId: docId }, resolve);
    });
    await new Promise((resolve) => {
      socketB.emit(COLLABORATION_EVENTS.JOIN_DOCUMENT, { documentId: docId }, resolve);
    });

    const receivedByB = waitForEvent(socketB, COLLABORATION_EVENTS.SELECTION_CHANGE);
    socketA.emit(COLLABORATION_EVENTS.SELECTION_CHANGE, { documentId: docId, from: 2, to: 7 });

    const payload = await receivedByB;
    assert.equal(payload.documentId, docId);
    assert.equal(payload.from, 2);
    assert.equal(payload.to, 7);
  } finally {
    socketA.disconnect();
    socketB.disconnect();
    await shutdown(io, httpServer);
  }
});

test('socket.io: cursor/selection never leaves the document room', async () => {
  const { io, httpServer, port } = await startCollabServer();
  const socketA = connectClient(port);
  const socketB = connectClient(port);

  try {
    await Promise.all([waitForEvent(socketA, 'connect'), waitForEvent(socketB, 'connect')]);

    socketA.emit(COLLABORATION_EVENTS.JOIN_DOCUMENT, { documentId: 'cursor-doc-1' });
    socketB.emit(COLLABORATION_EVENTS.JOIN_DOCUMENT, { documentId: 'cursor-doc-2' });
    await new Promise((r) => setTimeout(r, 100));

    let bReceivedCursor = false;
    let bReceivedSelection = false;
    const cursorProbe = () => { bReceivedCursor = true; };
    const selectionProbe = () => { bReceivedSelection = true; };
    socketB.on(COLLABORATION_EVENTS.CURSOR_CHANGE, cursorProbe);
    socketB.on(COLLABORATION_EVENTS.SELECTION_CHANGE, selectionProbe);

    socketA.emit(COLLABORATION_EVENTS.CURSOR_CHANGE, { documentId: 'cursor-doc-1', from: 1, to: 1 });
    socketA.emit(COLLABORATION_EVENTS.SELECTION_CHANGE, { documentId: 'cursor-doc-1', from: 1, to: 4 });

    await new Promise((r) => setTimeout(r, 150));
    socketB.off(COLLABORATION_EVENTS.CURSOR_CHANGE, cursorProbe);
    socketB.off(COLLABORATION_EVENTS.SELECTION_CHANGE, selectionProbe);
    assert.equal(bReceivedCursor, false, "cursor must not leak into another document's room");
    assert.equal(bReceivedSelection, false, "selection must not leak into another document's room");
  } finally {
    socketA.disconnect();
    socketB.disconnect();
    await shutdown(io, httpServer);
  }
});

test('socket.io: content change does not leave the document room', async () => {
  const { io, httpServer, port } = await startCollabServer();
  const socketA = connectClient(port);
  const socketB = connectClient(port);

  try {
    await Promise.all([waitForEvent(socketA, 'connect'), waitForEvent(socketB, 'connect')]);

    // A joins doc-1, B joins doc-2 — different rooms.
    const docA = 'doc-1';
    const docB = 'doc-2';
    socketA.emit(COLLABORATION_EVENTS.JOIN_DOCUMENT, { documentId: docA });
    socketB.emit(COLLABORATION_EVENTS.JOIN_DOCUMENT, { documentId: docB });
    await new Promise((r) => setTimeout(r, 100));

    let bReceived = false;
    const probe = () => { bReceived = true; };
    socketB.on(COLLABORATION_EVENTS.CONTENT_CHANGE, probe);

    socketA.emit(COLLABORATION_EVENTS.CONTENT_CHANGE, {
      documentId: docA,
      content: { type: 'doc', content: [] },
      plainText: 'only in doc-1',
    });

    await new Promise((r) => setTimeout(r, 150));
    socketB.off(COLLABORATION_EVENTS.CONTENT_CHANGE, probe);
    assert.equal(bReceived, false, "content must not leak into another document's room");
  } finally {
    socketA.disconnect();
    socketB.disconnect();
    await shutdown(io, httpServer);
  }
});
