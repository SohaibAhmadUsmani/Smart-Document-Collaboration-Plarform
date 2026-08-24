import { Folder } from '../models/Folder.js';
import { AppError } from '../utils/AppError.js';

async function assertParentInSameWorkspace(workspaceId, parentFolderId) {
  if (!parentFolderId) return;
  const parent = await Folder.findById(parentFolderId).lean();
  if (!parent) {
    throw new AppError('Parent folder not found', 404);
  }
  if (String(parent.workspace) !== String(workspaceId)) {
    throw new AppError('Parent folder belongs to a different workspace', 400);
  }
}

/** Walks up from candidateParentId; throws if it ever reaches folderId. */
async function assertNoCycle(folderId, candidateParentId) {
  let currentId = candidateParentId;
  const seen = new Set();

  while (currentId) {
    if (String(currentId) === String(folderId)) {
      throw new AppError('Cannot move a folder into itself or one of its own subfolders', 400);
    }
    if (seen.has(String(currentId))) {
      // Defensive: pre-existing corrupt data shouldn't infinite-loop us.
      break;
    }
    seen.add(String(currentId));

    const current = await Folder.findById(currentId).select('parentFolder').lean();
    currentId = current?.parentFolder ?? null;
  }
}

async function createFolder(workspaceId, { name, parentFolderId, createdBy }) {
  await assertParentInSameWorkspace(workspaceId, parentFolderId);

  return Folder.create({
    workspace: workspaceId,
    parentFolder: parentFolderId ?? null,
    name,
    createdBy,
  });
}

/** Flat list; the frontend builds the tree client-side via parentFolder. */
async function listFolders(workspaceId) {
  return Folder.find({ workspace: workspaceId }).sort({ name: 1 }).lean();
}

async function getFolderById(folderId) {
  const folder = await Folder.findById(folderId).lean();
  if (!folder) {
    throw new AppError('Folder not found', 404);
  }
  return folder;
}

async function renameFolder(folderId, name) {
  const folder = await Folder.findByIdAndUpdate(
    folderId,
    { $set: { name } },
    { new: true, runValidators: true },
  );
  if (!folder) {
    throw new AppError('Folder not found', 404);
  }
  return folder;
}

async function moveFolder(folderId, newParentFolderId) {
  const folder = await Folder.findById(folderId);
  if (!folder) {
    throw new AppError('Folder not found', 404);
  }

  if (newParentFolderId) {
    await assertParentInSameWorkspace(folder.workspace, newParentFolderId);
    await assertNoCycle(folderId, newParentFolderId);
  }

  folder.parentFolder = newParentFolderId ?? null;
  await folder.save();
  return folder;
}

/** Deletes a folder and everything nested beneath it. */
async function deleteFolder(folderId) {
  const idsToDelete = [folderId];
  let frontier = [folderId];

  while (frontier.length > 0) {
    const children = await Folder.find({ parentFolder: { $in: frontier } })
      .select('_id')
      .lean();
    const childIds = children.map((child) => String(child._id));
    if (childIds.length === 0) break;
    idsToDelete.push(...childIds);
    frontier = childIds;
  }

  await Folder.deleteMany({ _id: { $in: idsToDelete } });
  return { deletedCount: idsToDelete.length };
}

export const folderService = {
  createFolder,
  listFolders,
  getFolderById,
  renameFolder,
  moveFolder,
  deleteFolder,
};
