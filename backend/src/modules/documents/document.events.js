import EventEmitter from 'events';

class DocumentEventEmitter extends EventEmitter {}

export const documentEvents = new DocumentEventEmitter();

export const DOCUMENT_EVENTS = {
  CREATED: 'document.created',
  METADATA_UPDATED: 'document.metadata_updated',
  CONTENT_SAVED: 'document.content_saved',
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
 * Emits a structured document domain lifecycle event asynchronously.
 *
 * @param {string} eventType - One of DOCUMENT_EVENTS
 * @param {Object} payload - Event payload data
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
