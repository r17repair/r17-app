function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getSafeDownloadURL(value: unknown): string | null {
  if (!isRecord(value)) return null;

  const rawURL =
    value.urlDownload ??
    value.downloadURL ??
    value.fileUrl ??
    value.downloadUrl;
  if (typeof rawURL !== "string" || !rawURL.trim()) return null;

  try {
    const url = new URL(rawURL.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function getSafeDirectDownloadURL(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
