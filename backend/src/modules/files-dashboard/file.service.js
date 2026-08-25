import { FileModel } from './file.model.js';
import { buildDownloadUrl, deleteFromDisk } from './file.storage.js';
import { logActivity } from './activityLog.service.js';

export async function createFileRecord({ multerFile, workspaceId, folderId, documentId, userId }) {
  const file = await FileModel.create({
    fileName: multerFile.originalname,
    originalName: multerFile.originalname,
    mimeType: multerFile.mimetype,
    fileSize: multerFile.size,
    storageKey: multerFile.filename,
    downloadUrl: buildDownloadUrl(multerFile.filename),
    workspaceId,
    folderId: folderId || null,
    documentId: documentId || null,
    uploadedBy: userId,
  });

  await logActivity({
    action: 'file.uploaded',
    entityId: file._id.toString(),
    entityName: file.fileName,
    workspaceId,
    userId,
    metadata: { fileSize: file.fileSize, mimeType: file.mimeType },
  });

  return file;
}

export async function listFiles({ workspaceId, folderId }) {
  const query = { workspaceId, isDeleted: false };
  if (folderId !== undefined) {
    query.folderId = folderId || null;
  }
  return FileModel.find(query).sort({ updatedAt: -1 }).lean().exec();
}

export async function getFileById(fileId) {
  return FileModel.findOne({ _id: fileId, isDeleted: false }).exec();
}

export async function renameFile(fileId, newName, userId) {
  const file = await FileModel.findOne({ _id: fileId, isDeleted: false }).exec();
  if (!file) return null;

  const oldName = file.fileName;
  file.fileName = newName;
  await file.save();

  await logActivity({
    action: 'file.renamed',
    entityId: file._id.toString(),
    entityName: file.fileName,
    workspaceId: file.workspaceId,
    userId,
    metadata: { oldName, newName },
  });

  return file;
}

export async function moveFile(fileId, targetFolderId, userId) {
  const file = await FileModel.findOne({ _id: fileId, isDeleted: false }).exec();
  if (!file) return null;

  const oldFolderId = file.folderId;
  file.folderId = targetFolderId || null;
  await file.save();

  await logActivity({
    action: 'file.moved',
    entityId: file._id.toString(),
    entityName: file.fileName,
    workspaceId: file.workspaceId,
    userId,
    metadata: { oldFolderId, newFolderId: file.folderId },
  });

  return file;
}

export async function softDeleteFile(fileId, userId) {
  const file = await FileModel.findOne({ _id: fileId, isDeleted: false }).exec();
  if (!file) return null;

  file.isDeleted = true;
  file.deletedAt = new Date();
  await file.save();

  await logActivity({
    action: 'file.deleted',
    entityId: file._id.toString(),
    entityName: file.fileName,
    workspaceId: file.workspaceId,
    userId,
    metadata: {},
  });

  return file;
}

export async function permanentlyDeleteFile(fileId) {
  const file = await FileModel.findById(fileId).exec();
  if (!file) return null;
  deleteFromDisk(file.storageKey);
  await FileModel.deleteOne({ _id: fileId }).exec();
  return file;
}