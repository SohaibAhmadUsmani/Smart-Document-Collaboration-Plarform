/**
 * historyModel.js
 * Owner: Aiman
 * 
 * Defines the data structure for document version snapshots and search indexing.
 * Pre-populated with initial sample version history containing full TipTap AST formatting.
 */

import mongoose from 'mongoose';

// In-memory data store for versions (maintained for fast cache / test fallbacks)
export const inMemoryVersionStore = [];

const versionSnapshotSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      default: 'Untitled Document',
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    createdBy: {
      type: String,
      default: 'Active Editor',
    },
    changeSummary: {
      type: String,
      default: 'Saved version',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

versionSnapshotSchema.index({ documentId: 1, versionNumber: -1 });

export const VersionModel =
  mongoose.models.VersionSnapshot || mongoose.model('VersionSnapshot', versionSnapshotSchema);

/**
 * Creates a formatted Version object record and persists to MongoDB when available.
 * 
 * @param {Object} params
 * @param {string} params.documentId - The ID of the document this version belongs to.
 * @param {string} params.title - Document title at the time of snapshot.
 * @param {string} params.content - Full document text/content snapshot.
 * @param {string} params.createdBy - User ID or name who created this version.
 * @param {string} [params.changeSummary] - Description of changes made.
 * @returns {Promise<Object>} A new version snapshot record object.
 */
export async function createVersionRecord({ documentId, title, content, createdBy, changeSummary = 'Saved version' }) {
  const documentVersions = inMemoryVersionStore.filter(v => v.documentId === String(documentId));
  const maxMemVersion = documentVersions.reduce((max, v) => Math.max(max, v.versionNumber || 0), 0);
  let versionNumber = maxMemVersion + 1;

  if (mongoose.connection?.readyState === 1) {
    try {
      const highestDbVersion = await VersionModel.findOne({ documentId: String(documentId) })
        .sort({ versionNumber: -1 })
        .select('versionNumber')
        .lean();
      if (highestDbVersion && highestDbVersion.versionNumber >= versionNumber) {
        versionNumber = highestDbVersion.versionNumber + 1;
      }
    } catch {
      // Fall back to in-memory version calculation
    }
  }

  const authorName =
    createdBy && createdBy !== 'Unknown User' && createdBy !== 'Unknown' && !createdBy.startsWith('66cc')
      ? createdBy
      : 'Active Editor';

  const stringContent = typeof content === 'object' ? JSON.stringify(content) : (content || '');

  let dbRecord = null;
  if (mongoose.connection?.readyState === 1) {
    try {
      dbRecord = await VersionModel.create({
        documentId: String(documentId),
        versionNumber,
        title: title || 'Untitled Document',
        content: stringContent,
        createdBy: authorName,
        changeSummary,
      });
    } catch {
      // Fall back to in-memory ID if DB write fails
    }
  }

  const versionRecord = {
    id: dbRecord ? dbRecord._id.toString() : `ver_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    documentId: String(documentId),
    versionNumber,
    title: title || 'Untitled Document',
    content: stringContent,
    createdBy: authorName,
    changeSummary,
    createdAt: dbRecord?.createdAt ? dbRecord.createdAt.toISOString() : new Date().toISOString()
  };

  inMemoryVersionStore.push(versionRecord);
  return versionRecord;
}

