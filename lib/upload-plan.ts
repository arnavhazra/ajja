/**
 * Upload routing for the desk. Photographs always travel straight from the
 * browser to Vercel Blob — the function only ever sees the file name and MIME
 * type (the token request) and later the resulting Blob URL. This matters most
 * above the 4.5 MB function body limit: no file bytes ever pass through a
 * function, so larger photos keep working.
 */
export const UPLOAD_MAX_BYTES = 15 * 1024 * 1024;
export const UPLOAD_MAX_FILES = 12;
export const UPLOAD_ATTEMPTS = 3;
/** Files above the serverless body limit must never POST bytes to the app. */
export const FUNCTION_BODY_LIMIT = 4.5 * 1024 * 1024;

export type UploadPlan =
  | { mode: "direct"; attempts: number }
  | { mode: "rejected"; message: string };

export function planUpload(file: { name: string; size: number }): UploadPlan {
  if (file.size > UPLOAD_MAX_BYTES) {
    return { mode: "rejected", message: `${file.name} is larger than 15 MB.` };
  }
  return { mode: "direct", attempts: UPLOAD_ATTEMPTS };
}
