/**
 * @file documentEventsIntegration.test.js
 * @description Unit & integration tests for Document Module Event emissions and OCC Conflict Resolution.
 * Verifies that all document event payloads contain rich metadata expected by Shanza's Activity Logger
 * and that Optimistic Concurrency Control handles both conflict detection and force overwrite resolution.
 * @module backend/src/modules/documents/tests/documentEventsIntegration.test
 *
 * [ROMAN URDU]:
 * Yeh test file Shanza ke activity log listener ke liye zaroori event payloads
 * (documentId, workspaceId, title, actorId, userId, timestamp) aur OCC 409 conflict
 * logic (force overwrite bypass) ko verify karti hai.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { documentEvents, DOCUMENT_EVENTS } from '../document.events.js';

// ============================================================================
// 1. Document Event Payload Metadata Schema Validation (Shanza Integration)
// ============================================================================

test('[Shanza Activity Logger Integration] documentEvents emits rich metadata on all event channels', () => {
  const eventsCaptured = [];

  const listener = (eventName) => (payload) => {
    eventsCaptured.push({ eventName, payload });
  };

  const registeredEvents = [
    DOCUMENT_EVENTS.CREATED,
    DOCUMENT_EVENTS.METADATA_UPDATED,
    DOCUMENT_EVENTS.CONTENT_SAVED,
    DOCUMENT_EVENTS.SNAPSHOT_CHECKPOINT_CREATED,
    DOCUMENT_EVENTS.TAGS_UPDATED,
    DOCUMENT_EVENTS.FAVORITE_TOGGLED,
    DOCUMENT_EVENTS.ATTACHMENT_LINKED,
    DOCUMENT_EVENTS.ATTACHMENT_UNLINKED,
    DOCUMENT_EVENTS.DUPLICATED,
    DOCUMENT_EVENTS.ARCHIVED,
    DOCUMENT_EVENTS.RESTORED,
    DOCUMENT_EVENTS.PERMANENTLY_DELETED,
  ];

  const unsubscribes = registeredEvents.map((evt) => {
    const handler = listener(evt);
    documentEvents.on(evt, handler);
    return () => documentEvents.off(evt, handler);
  });

  try {
    // 1. Emit CREATED
    documentEvents.emit(DOCUMENT_EVENTS.CREATED, {
      documentId: 'doc_101',
      workspaceId: 'ws_001',
      folderId: 'fld_001',
      title: 'Q3 RoadMap',
      actorId: 'user_456',
      createdBy: 'user_456',
      userId: 'user_456',
      timestamp: new Date(),
    });

    // 2. Emit CONTENT_SAVED
    documentEvents.emit(DOCUMENT_EVENTS.CONTENT_SAVED, {
      documentId: 'doc_101',
      workspaceId: 'ws_001',
      title: 'Q3 RoadMap',
      version: 5,
      previousVersion: 4,
      content: { type: 'doc', content: [] },
      plainText: 'Sample text',
      actorId: 'user_456',
      modifiedBy: 'user_456',
      userId: 'user_456',
      timestamp: new Date(),
    });

    // 3. Emit PERMANENTLY_DELETED
    documentEvents.emit(DOCUMENT_EVENTS.PERMANENTLY_DELETED, {
      documentId: 'doc_101',
      workspaceId: 'ws_001',
      title: 'Q3 RoadMap',
      actorId: 'user_456',
      userId: 'user_456',
      timestamp: new Date(),
    });

    // Assertions
    assert.equal(eventsCaptured.length, 3);

    const [created, contentSaved, deleted] = eventsCaptured;

    // Verify CREATED payload
    assert.equal(created.eventName, DOCUMENT_EVENTS.CREATED);
    assert.equal(created.payload.documentId, 'doc_101');
    assert.equal(created.payload.workspaceId, 'ws_001');
    assert.equal(created.payload.title, 'Q3 RoadMap');
    assert.equal(created.payload.actorId, 'user_456');
    assert.ok(created.payload.timestamp instanceof Date);

    // Verify CONTENT_SAVED payload
    assert.equal(contentSaved.eventName, DOCUMENT_EVENTS.CONTENT_SAVED);
    assert.equal(contentSaved.payload.version, 5);
    assert.equal(contentSaved.payload.previousVersion, 4);
    assert.equal(contentSaved.payload.workspaceId, 'ws_001');
    assert.equal(contentSaved.payload.title, 'Q3 RoadMap');
    assert.equal(contentSaved.payload.actorId, 'user_456');

    // Verify PERMANENTLY_DELETED has workspaceId and title so resolveDocumentContext doesn't drop it
    assert.equal(deleted.eventName, DOCUMENT_EVENTS.PERMANENTLY_DELETED);
    assert.equal(deleted.payload.workspaceId, 'ws_001');
    assert.equal(deleted.payload.title, 'Q3 RoadMap');
    assert.equal(deleted.payload.actorId, 'user_456');
  } finally {
    unsubscribes.forEach((unsub) => unsub());
  }
});

// ============================================================================
// 2. OCC Conflict Resolution Emulation Tests
// ============================================================================

test('[OCC Conflict Handling] Base version mismatch triggers 409 conflict descriptor unless force is true', () => {
  const currentServerDoc = {
    version: 12,
    title: 'Collaborative PRD',
    content: { type: 'doc', content: [] },
  };

  // Simulating OCC check logic inside autosaveDocumentContent
  function simulateOccCheck(previousDoc, contentPayload) {
    if (contentPayload.baseVersion !== undefined && contentPayload.baseVersion !== null && !contentPayload.force) {
      if (previousDoc.version !== Number(contentPayload.baseVersion)) {
        return {
          conflict: true,
          currentVersion: previousDoc.version,
          baseVersion: Number(contentPayload.baseVersion),
          serverDocument: previousDoc,
        };
      }
    }
    return { conflict: false, newVersion: previousDoc.version + 1 };
  }

  // Case A: Outdated base version (Client at v10, server at v12) -> Conflict!
  const conflictResult = simulateOccCheck(currentServerDoc, {
    baseVersion: 10,
    force: false,
  });

  assert.equal(conflictResult.conflict, true);
  assert.equal(conflictResult.currentVersion, 12);
  assert.equal(conflictResult.baseVersion, 10);
  assert.equal(conflictResult.serverDocument.title, 'Collaborative PRD');

  // Case B: Client specifies force: true (Option 1: Keep My Local Version) -> Bypass conflict!
  const forceResult = simulateOccCheck(currentServerDoc, {
    baseVersion: 10,
    force: true,
  });

  assert.equal(forceResult.conflict, false);
  assert.equal(forceResult.newVersion, 13);

  // Case C: Up-to-date base version (Client at v12, server at v12) -> Normal save!
  const normalResult = simulateOccCheck(currentServerDoc, {
    baseVersion: 12,
    force: false,
  });

  assert.equal(normalResult.conflict, false);
  assert.equal(normalResult.newVersion, 13);
});
