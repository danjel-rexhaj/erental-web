// Phone/camera photos often arrive at 5000px+ and 5MB+. Shown in a ~300px card, the browser has
// to shrink them ~18x, which renders jagged ("pixelated") and loads slowly -- so images are scaled
// down in the browser before upload. Non-images (PDFs) and already-small images pass through as-is.
export async function shrinkImage(file, maxSide = 1920, quality = 0.85) {
  if (!file || !file.type?.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    // from-image applies the EXIF rotation, so portrait phone shots don't come out sideways.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) { bitmap.close?.(); return file; }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// Resized copy of a CDN photo via Cloudflare Image Transformations (must be enabled on the
// erental.store zone). Callers fall back to the original URL on error -- but while it's off that
// means a 404 round trip before every photo, so after the first failure we stop asking for resized
// copies for a day (remembered across visits) and load originals straight away.
const CDN_HOST = "https://cdn.erental.store/";
const RESIZE_OFF_KEY = "erental.resizeOffUntil";
let resizeOff = (() => {
  try { return Number(localStorage.getItem(RESIZE_OFF_KEY)) > Date.now(); } catch { return false; }
})();
export function markResizeUnavailable() {
  if (resizeOff) return;
  resizeOff = true;
  try { localStorage.setItem(RESIZE_OFF_KEY, String(Date.now() + 24 * 3600 * 1000)); } catch { /* private mode */ }
}
export function resizedPhotoUrl(url, width) {
  if (resizeOff || !url || !width || !url.startsWith(CDN_HOST)) return url;
  return `${CDN_HOST}cdn-cgi/image/width=${width},quality=82,format=auto/${url.slice(CDN_HOST.length)}`;
}
