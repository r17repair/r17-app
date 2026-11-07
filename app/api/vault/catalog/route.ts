import { connection, NextResponse } from "next/server";
import {
  databaseRef,
  allowedPublicAssetURL,
  getSiteSettings,
  jsonError,
  normalizeFileCategory,
} from "@/lib/serverApi";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : null;
}

function categoryKey(value: unknown) {
  if (typeof value !== "string") return null;
  const category = value.trim().toLocaleLowerCase("id");
  if (category === "firmware" || category === "firmware & software") return "firmware";
  if (category === "tools" || category === "tools & drivers" || category === "tools & software") return "tools";
  if (category === "schematic" || category === "schematics" || category === "schematic & layout") {
    return "schematics";
  }
  return null;
}

function githubPathURL(path: unknown, settings: Awaited<ReturnType<typeof getSiteSettings>>) {
  if (typeof path !== "string" || !path.trim() || !settings.githubStorageRepo) return null;
  const segments = path.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  try {
    const base = new URL(settings.githubStorageRepo.endsWith("/")
      ? settings.githubStorageRepo
      : `${settings.githubStorageRepo}/`);
    if (base.protocol !== "https:" || base.hostname !== "raw.githubusercontent.com") return null;
    return allowedPublicAssetURL(
      new URL(segments.map(encodeURIComponent).join("/"), base).toString(),
      settings,
    );
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  await connection();
  try {
    const category = normalizeFileCategory(new URL(request.url).searchParams.get("category"));
    const [snapshot, settings] = await Promise.all([
      databaseRef("files").get(),
      getSiteSettings(),
    ]);
    const value: unknown = snapshot.val();
    if (!isRecord(value) && !Array.isArray(value)) {
      return NextResponse.json({ files: [] });
    }

    const entries = Array.isArray(value)
      ? value.map((file, index) => [String(index), file] as const)
      : Object.entries(value);
    const files = entries.flatMap(([id, raw]) => {
      if (
        !isRecord(raw) ||
        (raw.status !== undefined && raw.status !== "published") ||
        categoryKey(raw.subdomain_type ?? raw.category) !== category
      ) return [];
      const downloadUrl = allowedPublicAssetURL(raw.download_url, settings) ??
        githubPathURL(raw.github_raw_path, settings) ??
        allowedPublicAssetURL(raw.github_file_path, settings) ??
        allowedPublicAssetURL(raw.githubUrl, settings);
      const viewUrl = allowedPublicAssetURL(raw.view_url, settings);
      return [{
        id,
        title: text(raw.title) ?? text(raw.name) ?? text(raw.fileName) ?? id,
        description: text(raw.description),
        category: text(raw.category) ?? text(raw.type),
        version: text(raw.version),
        size: text(raw.size) ?? text(raw.fileSize),
        downloadCount: typeof (raw.downloads_count ?? raw.downloadCount) === "number"
          ? Number(raw.downloads_count ?? raw.downloadCount)
          : 0,
        tokenCost: Number.isSafeInteger(raw.token_cost ?? raw.tokenCost) &&
          Number(raw.token_cost ?? raw.tokenCost) >= 0
          ? Number(raw.token_cost ?? raw.tokenCost)
          : 0,
        viewUrl,
        downloadUrl,
      }];
    });

    return NextResponse.json({ files });
  } catch (error) {
    return jsonError(error);
  }
}
