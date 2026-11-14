/** The browser may omit a MIME type for a file selected from disk. */
export function lessonFileType(file: File): "video" | "document" | null {
  const type = file.type.toLowerCase();
  if (type === "application/pdf") return "document";
  if (type === "video/mp4") return "video";
  if (type && type !== "application/octet-stream") return null;
  if (/\.pdf$/i.test(file.name)) return "document";
  if (/\.mp4$/i.test(file.name)) return "video";
  return null;
}

/** Read metadata from the selected local file before creating a resource. */
export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    const timeout = window.setTimeout(() => finish(), 15000);
    const finish = (duration?: number) => {
      window.clearTimeout(timeout);
      video.onloadedmetadata = null;
      video.onerror = null;
      video.removeAttribute("src");
      URL.revokeObjectURL(objectUrl);
      if (duration !== undefined && Number.isFinite(duration) && duration > 0 && duration <= 86400) {
        resolve(Math.ceil(duration));
      } else {
        reject(new Error("Could not read this video's duration. Choose a playable MP4 file up to 24 hours long."));
      }
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => finish(video.duration);
    video.onerror = () => finish();
    video.src = objectUrl;
  });
}
