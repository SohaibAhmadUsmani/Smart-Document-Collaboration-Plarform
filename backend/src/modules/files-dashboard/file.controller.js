import * as fileService from './file.service.js';
import * as activityLogService from './activityLog.service.js';
import { resolveStoragePath } from './file.storage.js';
import fs from 'fs';

function getUserId(req) {
  return req.user?.id || req.user?._id || 'anonymous-user';
}

export async function uploadFileHandler(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'No file was uploaded.',
      });
    }

    const { workspaceId, folderId, documentId } = req.body;
    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'workspaceId is required.',
      });
    }

    const userId = getUserId(req);
    const file = await fileService.createFileRecord({
      multerFile: req.file,
      workspaceId,
      folderId,
      documentId,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: file,
    });
  } catch (error) {
    next(error);
  }
}

export async function duplicateFileHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { folderId } = req.body;
    const userId = getUserId(req);

    const copy = await fileService.duplicateFile(id, folderId, userId);
    if (!copy) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `File with ID '${id}' was not found.`,
      });
    }

    return res.status(201).json({ success: true, message: 'File copied', data: copy });
  } catch (error) {
    next(error);
  }
}
export async function listFilesHandler(req, res, next) {
  try {
    const { workspaceId, folderId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'workspaceId query parameter is required.',
      });
    }

    const files = await fileService.listFiles({ workspaceId, folderId });
    return res.status(200).json({ success: true, data: files });
  } catch (error) {
    next(error);
  }
}

export async function downloadFileHandler(req, res, next) {
  try {
    const { storageKey } = req.params;
    const fullPath = resolveStoragePath(storageKey);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'File not found on server.',
      });
    }

    return res.download(fullPath);
  } catch (error) {
    next(error);
  }
}

export async function renameFileHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { fileName } = req.body;

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Valid fileName is required.',
      });
    }

    const userId = getUserId(req);
    const file = await fileService.renameFile(id, fileName, userId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `File with ID '${id}' was not found.`,
      });
    }

    return res.status(200).json({ success: true, message: 'File renamed', data: file });
  } catch (error) {
    next(error);
  }
}

export async function moveFileHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { folderId } = req.body;

    const userId = getUserId(req);
    const file = await fileService.moveFile(id, folderId, userId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `File with ID '${id}' was not found.`,
      });
    }

    return res.status(200).json({ success: true, message: 'File moved', data: file });
  } catch (error) {
    next(error);
  }
}

export async function deleteFileHandler(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const file = await fileService.softDeleteFile(id, userId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `File with ID '${id}' was not found.`,
      });
    }

    return res.status(200).json({ success: true, message: 'File deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getRecentActivityHandler(req, res, next) {
  try {
    const { workspaceId, limit } = req.query;
    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'workspaceId query parameter is required.',
      });
    }

    const activity = await activityLogService.getRecentActivity({ workspaceId, limit });
    return res.status(200).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
}