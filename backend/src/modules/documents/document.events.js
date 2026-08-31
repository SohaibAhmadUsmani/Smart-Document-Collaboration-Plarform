/**
 * @file document.events.js
 * @description Domain event bus and event definitions for the Document Editor module in DocSync Pro.
 * Provides asynchronous event dispatching for document creation, content saves,
 * snapshot checkpoints, favorites, tags, attachments, and archive lifecycle transitions.
 * @module backend/src/modules/documents/document.events
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh file document module ke lifecycle events ka event emitter define karti hai.
 * Document create hone, autosave hone, 25-edit snapshot checkpoint banne, ya archive hone par
 * yeh events trigger hote hain taake doosray modules (jaise Ayyan ka notifications system
 * ya Maira ka audit logs) asynchronously notify ho sakein.
 */

import EventEmitter from 'events';

class DocumentEventEmitter extends EventEmitter {}

export const documentEvents = new DocumentEventEmitter();

/**
 * Standard event type constants for document domain lifecycle.
 *
 * [ROMAN URDU]:
 * Document domain ke standard event types ka enum/dictionary.
 */
export const DOCUMENT_EVENTS = {
  CREATED: 'document.created',
  METADATA_UPDATED: 'document.metadata_updated',
  CONTENT_SAVED: 'document.content_saved',
  SNAPSHOT_CHECKPOINT_CREATED: 'document.snapshot_checkpoint_created',
  DUPLICATED: 'document.duplicated',
  ARCHIVED: 'document.archived',
  RESTORED: 'document.restored',
  PERMANENTLY_DELETED: 'document.permanently_deleted',
  TAGS_UPDATED: 'document.tags_updated',
  FAVORITE_TOGGLED: 'document.favorite_toggled',
  ATTACHMENT_LINKED: 'document.attachment_linked',
  ATTACHMENT_UNLINKED: 'document.attachment_unlinked',
};

/**
 * Emits a structured document domain lifecycle event asynchronously on process.nextTick.
 *
 * [ROMAN URDU]:
 * Asynchronous document event emit karta hai `process.nextTick` ke zariye,
 * taake main execution thread block na ho aur event ke sath ISO timestamp include ho.
 *
 * @param {string} eventType - One of DOCUMENT_EVENTS
 * @param {Object} payload - Event payload data
 * @returns {void}
 */
export function emitDocumentEvent(eventType, payload) {
  process.nextTick(() => {
    documentEvents.emit(eventType, {
      type: eventType,
      timestamp: new Date().toISOString(),
      ...payload,
    });
  });
}
