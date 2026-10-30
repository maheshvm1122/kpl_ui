const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_UPLOAD_MB = 5;

/**
 * Shrinks a phone photo in the browser before upload so it is quick on slow networks.
 * Falls back to the original file if the browser cannot process it.
 */
export async function compressImage(file, maxSize = 1400, quality = 0.85) {
  if (!file || !file.type?.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return file;
    return new File([blob], (file.name || 'photo').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/** Returns an error message, or null if the file is acceptable. */
export function validateImage(file) {
  if (!file) return 'Please add a photo';
  if (file.type && !ALLOWED.includes(file.type) && !file.type.startsWith('image/')) {
    return 'Please choose a JPG, PNG or WEBP photo';
  }
  return null;
}

export function validateUploadSize(file) {
  if (file && file.size > MAX_UPLOAD_MB * 1024 * 1024) return `Photo is too large. Maximum size is ${MAX_UPLOAD_MB} MB`;
  return null;
}
