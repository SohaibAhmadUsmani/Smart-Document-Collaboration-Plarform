import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

// Files are stored on local disk for now, under backend/uploads.
// Swap this out for S3/R2 later without touching the rest of the module.
export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'image/png',
  'image/jpeg',
]);

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_ROOT);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

export const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg']);

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    const error = new Error(
      `File type '${file.mimetype}' with extension '${ext}' is not supported. Allowed: PDF, DOCX, XLSX, PNG, JPG.`
    );
    error.status = 400;
    return cb(error);
  }
  cb(null, true);
}

export const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

export function buildDownloadUrl(storedFileName) {
  return `/api/files/download/${storedFileName}`;
}

/**
 * Resolves and validates absolute filesystem storage path for a file key.
 * Sanitizes input using path.basename to prevent directory traversal attacks
 * and ensures that the resolved path is strictly contained within UPLOAD_ROOT.
 *
 * [ROMAN URDU]:
 * Yeh function file storage key ka absolute path resolve karta hai.
 * Directory traversal attacks (jaise ../ ya ..\) se bachne ke liye `path.basename` se sanitize
 * karta hai aur ensure karta hai ke resolved path `UPLOAD_ROOT` directory ke andar hi rahe.
 *
 * @param {string} storageKey - Stored filename key
 * @returns {string} Sanitized absolute file path
 * @throws {Error} If key is invalid or directory traversal is detected
 */
export function resolveStoragePath(storageKey) {
  if (!storageKey || typeof storageKey !== 'string') {
    const error = new Error('Invalid storage key: key must be a non-empty string.');
    error.status = 400;
    throw error;
  }

  const safeKey = path.basename(storageKey);
  const resolvedPath = path.resolve(UPLOAD_ROOT, safeKey);

  // Ensure resolved path starts with UPLOAD_ROOT and is not the root folder itself
  if (!resolvedPath.startsWith(UPLOAD_ROOT) || resolvedPath === UPLOAD_ROOT) {
    const error = new Error('Access denied: directory traversal detected.');
    error.status = 403;
    throw error;
  }

  return resolvedPath;
}

export function deleteFromDisk(storageKey) {
  const fullPath = resolveStoragePath(storageKey);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}