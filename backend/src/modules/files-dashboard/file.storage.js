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

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error(
      `File type '${file.mimetype}' is not supported. Allowed: PDF, DOCX, XLSX, PNG, JPG.`
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

export function resolveStoragePath(storageKey) {
  return path.join(UPLOAD_ROOT, storageKey);
}

export function deleteFromDisk(storageKey) {
  const fullPath = resolveStoragePath(storageKey);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}