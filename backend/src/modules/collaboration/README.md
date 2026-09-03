# Collaboration module

Owner: Namra

Own WebSocket / Socket.IO setup, editing sync, presence, cursors, and online status here.

## Architecture

Collaboration is fully separated from document persistence.

- **Live collaboration:** editor change → Socket.IO → `document:<documentId>` room → other connected users.
- **Persistence:** editor change → existing autosave → document API → MongoDB (unchanged, owned by the Documents/Editor module).

No database writes happen on Socket.IO activity.

## Room identifier

The canonical Socket.IO room for a document is exactly:

```
document:<documentId>
```

All users editing the same document join the same room.

## Events (`events.js`)

- `document:join` — client joins a document room. Payload `{ documentId }`.
- `document:leave` — client leaves a document room. Payload `{ documentId }`.
- `document:change` — document content changed. Broadcast to **other** members of the room (sender excluded).
- `document:cursor` — a member's cursor position moved. Payload `{ documentId, from, to }` (sender excluded).
- `document:selection` — a member's selection range changed. Payload `{ documentId, from, to }` (sender excluded).
- `collaboration:presence` — server broadcasts active users for a document room.

## Files

- `collaborationServer.js` — Socket.IO wiring: handshake auth, room join/leave, content broadcast, presence.
- `presenceStore.js` — in-memory presence tracking (testable pure store, no database).
- `events.js` — shared event names and the room-name helper.
