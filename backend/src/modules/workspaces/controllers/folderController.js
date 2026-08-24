import { folderService } from '../services/folderService.js';
import { validateFolderInput } from '../validators/workspaceValidators.js';

async function create(req, res, next) {
  try {
    const input = validateFolderInput(req.body);
    const folder = await folderService.createFolder(req.params.workspaceId, {
      ...input,
      createdBy: req.user.id,
    });
    res.status(201).json({ folder });
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const folders = await folderService.listFolders(req.params.workspaceId);
    res.json({ folders });
  } catch (error) {
    next(error);
  }
}

async function getOne(req, res, next) {
  try {
    res.json({ folder: req.folder });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const input = validateFolderInput(req.body, { partial: true });
    let folder = req.folder;

    if (input.name !== undefined) {
      folder = await folderService.renameFolder(req.params.id, input.name);
    }
    if (input.parentFolderId !== undefined) {
      folder = await folderService.moveFolder(req.params.id, input.parentFolderId);
    }

    res.json({ folder });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const result = await folderService.deleteFolder(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export const folderController = { create, list, getOne, update, remove };
