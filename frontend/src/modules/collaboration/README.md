# Collaboration UI

Owner: Namra. Add presence, active users, cursor display, and real-time sync UI here.

## Frontend module

- `services/socketClient.js` — shared socket.io-client singleton (JWT passed via handshake auth).
- `context/CollaborationContext.jsx` — provides the socket and live connection state to the editor tree.
- `hooks/useDocumentCollaboration.js` — joins/leaves the document room, broadcasts local content, applies remote content into the existing TipTap editor, tracks presence.
- `hooks/usePresencePosition.js` — real-time cursor & selection presence (emits local position, renders remote carets/selections).
- `presence/presenceDecorationPlugin.js` — ProseMirror decorations for remote cursors & selections.
- `components/ActiveUsers.jsx` — minimal presence indicator (basic foundation; richer UI later).
- `types/collaboration.js` — shared event names + room-name helper.

## Integration

The module is mounted inside the editor tree (see `EditorCanvas`) and mirrors the existing editor state over Socket.IO. Persistence is untouched — the existing autosave still owns all document saving.
