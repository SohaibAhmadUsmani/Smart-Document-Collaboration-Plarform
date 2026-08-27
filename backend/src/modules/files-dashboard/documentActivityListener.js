import { documentEvents, DOCUMENT_EVENTS } from '../documents/document.events.js';
import { DocumentModel } from '../documents/document.model.js';
import { logActivity } from './activityLog.service.js';

// Event payloads are inconsistent across the documents module: some use
// "actorId", one uses "userId", the create event uses "createdBy".
function getActorId(payload) {
  return payload.actorId || payload.createdBy || payload.userId || 'unknown-user';
}

// Several events (favorite toggle, tags, attachments) don't carry
// workspaceId or a title, only documentId. Look the document up in those
// cases rather than skip logging or log incomplete data.
async function resolveDocumentContext(documentId, workspaceId) {
  if (workspaceId) {
    const doc = await DocumentModel.findById(documentId).select('title').lean().exec();
    return { workspaceId, title: doc?.title || 'Untitled Document' };
  }
  const doc = await DocumentModel.findById(documentId).select('title workspaceId').lean().exec();
  return {
    workspaceId: doc?.workspaceId || null,
    title: doc?.title || 'Untitled Document',
  };
}

function buildMetadata(action, payload) {
  switch (action) {
    case 'document.tags_updated':
      return { tags: payload.tags };
    case 'document.favorite_toggled':
      return { isFavorited: payload.isFavorited };
    case 'document.duplicated':
      return { originalDocumentId: payload.originalDocumentId };
    default:
      return {};
  }
}

async function handleEvent(action, documentId, payload) {
  try {
    const { workspaceId, title } = await resolveDocumentContext(documentId, payload.workspaceId);

    // Some events (e.g. permanently deleted) may no longer have a
    // resolvable document. Skip logging rather than write bad data.
    if (!workspaceId) return;

        await logActivity({
      action,
      entityType: 'document',
      entityId: documentId,
      entityName: title,
      workspaceId,
      userId: getActorId(payload),
      metadata: buildMetadata(action, payload),
    });
  } catch (error) {
    console.error(`Failed to log document activity (${action}):`, error.message);
  }
}

export function registerDocumentActivityListeners() {
  documentEvents.on(DOCUMENT_EVENTS.CREATED, (p) => handleEvent('document.created', p.documentId, p));
  documentEvents.on(DOCUMENT_EVENTS.METADATA_UPDATED, (p) => handleEvent('document.updated', p.documentId, p));
  documentEvents.on(DOCUMENT_EVENTS.TAGS_UPDATED, (p) => handleEvent('document.tags_updated', p.documentId, p));
  documentEvents.on(DOCUMENT_EVENTS.FAVORITE_TOGGLED, (p) => handleEvent('document.favorite_toggled', p.documentId, p));
  documentEvents.on(DOCUMENT_EVENTS.DUPLICATED, (p) => handleEvent('document.duplicated', p.newDocumentId, p));
  documentEvents.on(DOCUMENT_EVENTS.ARCHIVED, (p) => handleEvent('document.archived', p.documentId, p));
  documentEvents.on(DOCUMENT_EVENTS.RESTORED, (p) => handleEvent('document.restored', p.documentId, p));
  documentEvents.on(DOCUMENT_EVENTS.PERMANENTLY_DELETED, (p) => handleEvent('document.permanently_deleted', p.documentId, p));
}