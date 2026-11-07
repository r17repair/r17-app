import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  ApiError,
  allowedPublicAssetURL,
  databaseRef,
  ensureAvailable,
  getSiteSettings,
  jsonError,
  requireUser,
  validGitHubURL,
} from "@/lib/serverApi";

export async function POST(request: Request) {
  try {
    const { token, profile } = await requireUser(request);
    await ensureAvailable();
    if (profile.role !== "contributor" && profile.role !== "admin") {
      throw new ApiError("Akun kontributor yang telah disetujui diperlukan.", 403);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const rawCategory = body.category;
    if (
      rawCategory !== "firmware" &&
      rawCategory !== "tools" &&
      rawCategory !== "schematics" &&
      rawCategory !== "schematic"
    ) {
      throw new ApiError("Kategori file tidak valid.", 400);
    }
    const category = rawCategory === "schematic" ? "schematics" : rawCategory;
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 1500) : "";
    const githubUrl = body.githubUrl;
    if (title.length < 4) throw new ApiError("Judul file minimal 4 karakter.", 400);
    if (!validGitHubURL(githubUrl)) {
      throw new ApiError("Gunakan URL HTTPS GitHub (github.com atau raw.githubusercontent.com).", 400);
    }
    let fileName: string;
    let downloadUrl: string;
    let githubRawPath: string;
    try {
      const source = new URL(githubUrl);
      const segments = source.pathname.split("/").filter(Boolean);
      if (source.hostname === "github.com") {
        if (segments.length < 5 || segments[2] !== "blob") {
          throw new ApiError("URL GitHub harus menunjuk langsung ke file pada branch.", 400);
        }
        downloadUrl = `https://raw.githubusercontent.com/${segments[0]}/${segments[1]}/${segments.slice(3).map(encodeURIComponent).join("/")}`;
        githubRawPath = segments.slice(4).join("/");
      } else {
        downloadUrl = source.toString();
        githubRawPath = segments.slice(3).join("/");
      }
      fileName = decodeURIComponent(source.pathname.split("/").pop() ?? "")
        .replace(/[^A-Za-z0-9._-]/g, "_")
        .slice(0, 120);
    } catch {
      throw new ApiError("URL GitHub tidak valid.", 400);
    }
    if (!fileName) throw new ApiError("Nama file tidak valid.", 400);
    const settings = await getSiteSettings();
    const trustedURL = allowedPublicAssetURL(downloadUrl, settings);
    if (!trustedURL) {
      throw new ApiError("URL GitHub harus berasal dari repository penyimpanan yang diizinkan.", 400);
    }

    const viewUrl = typeof body.viewUrl === "string" && body.viewUrl.trim()
      ? allowedPublicAssetURL(body.viewUrl.trim(), settings)
      : null;
    if (typeof body.viewUrl === "string" && body.viewUrl.trim() && !viewUrl) {
      throw new ApiError("URL halaman detail harus menggunakan domain R17 yang diizinkan.", 400);
    }

    const id = randomUUID();
    const now = Date.now();
    await databaseRef(`files/${id}`).set({
      id,
      contributor_id: token.uid,
      title,
      description,
      category:
        category === "firmware"
          ? "Firmware & Software"
          : category === "schematics"
            ? "Schematic & Layout"
            : "Tools & Drivers",
      subdomain_type: category === "schematics" ? "schematic" : category,
      token_cost: 0,
      downloads_count: 0,
      github_file_path: trustedURL,
      github_raw_path: githubRawPath,
      download_url: trustedURL,
      view_url: viewUrl,
      file_name: fileName,
      status: "pending",
      created_at: new Date(now).toISOString(),
      updated_at: new Date(now).toISOString(),
    });
    return NextResponse.json({ success: true, id, status: "pending" }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
