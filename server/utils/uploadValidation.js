const path = require('path');

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);
const EXPECTED_MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};
const MIME_ALIASES = {
  'application/x-pdf': 'application/pdf',
  'image/jpg': 'image/jpeg',
};

const isAllowedUpload = (file) => {
  if (!file) return false;
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = MIME_ALIASES[String(file.mimetype || '').toLowerCase()] || String(file.mimetype || '').toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext)
    && (ALLOWED_MIME_TYPES.has(mime) || mime === 'application/octet-stream' || mime === 'binary/octet-stream')
    && (!ALLOWED_MIME_TYPES.has(mime) || mime === EXPECTED_MIME_TYPES[ext]);
};

const hasValidFileSignature = (file) => {
  const fs = require('fs');
  const fd = fs.openSync(file.path, 'r');
  const header = Buffer.alloc(1024);
  try { fs.readSync(fd, header, 0, header.length, 0); } finally { fs.closeSync(fd); }
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext === '.pdf') return header.includes(Buffer.from('%PDF-'));
  if (ext === '.png') return header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (ext === '.jpg' || ext === '.jpeg') return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (ext === '.webp') return header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP';
  return false;
};

const fileFilter = (req, file, cb) => {
  if (!isAllowedUpload(file)) {
    return cb(new Error('Unsupported file type. Upload PDF, JPG, JPEG, PNG, or WebP files only.'));
  }
  cb(null, true);
};

const toFileRecord = (file) => ({
  originalName: file.originalname,
  storedName: file.filename,
  path: file.path,
  mimeType: EXPECTED_MIME_TYPES[path.extname(file.originalname || '').toLowerCase()] || file.mimetype,
  size: file.size,
  pages: [],
});

module.exports = {
  MAX_UPLOAD_BYTES,
  fileFilter,
  isAllowedUpload,
  hasValidFileSignature,
  toFileRecord,
};
