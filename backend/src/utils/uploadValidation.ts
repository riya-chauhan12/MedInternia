import path from 'path';

// Raster image formats only. SVG is deliberately excluded: browsers execute
// <script> tags embedded in an SVG when it is loaded directly, so accepting
// image/svg+xml on an "image" upload allows stored XSS against anyone who
// later opens the uploaded file's URL (issue #409).
export const ALLOWED_UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const ALLOWED_UPLOAD_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

export const ALLOWED_RESUME_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
] as const;

export const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.docx', '.txt'] as const;

/**
 * Validates an uploaded file's MIME type and extension against an allowlist.
 * Both checks must pass -- relying on either alone lets an attacker rename
 * a malicious file to a trusted extension, or spoof the Content-Type header
 * while keeping a dangerous extension.
 */
export function isAllowedUpload(originalname: string, mimetype: string): boolean {
  const ext = path.extname(originalname).toLowerCase();
  return (
    (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(mimetype) &&
    (ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)
  );
}

export const ALLOWED_CASE_ATTACHMENT_MIME_TYPES = [
  ...ALLOWED_UPLOAD_MIME_TYPES,
  'video/mp4',
  'audio/mpeg',
  'audio/wav'
] as const;

export const ALLOWED_CASE_ATTACHMENT_EXTENSIONS = [
  ...ALLOWED_UPLOAD_EXTENSIONS,
  '.mp4',
  '.mp3',
  '.wav'
] as const;

export function isAllowedCaseAttachment(originalname: string, mimetype: string): boolean {
  const ext = path.extname(originalname).toLowerCase();
  return (
    (ALLOWED_CASE_ATTACHMENT_MIME_TYPES as readonly string[]).includes(mimetype) &&
    (ALLOWED_CASE_ATTACHMENT_EXTENSIONS as readonly string[]).includes(ext)
  );
}

export function isAllowedResumeUpload(originalname: string, mimetype: string): boolean {
  const ext = path.extname(originalname).toLowerCase();
  return (
    (ALLOWED_RESUME_MIME_TYPES as readonly string[]).includes(mimetype) &&
    (ALLOWED_RESUME_EXTENSIONS as readonly string[]).includes(ext)
  );
}
