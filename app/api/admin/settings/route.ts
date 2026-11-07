import { NextResponse } from "next/server";
import { ApiError, databaseRef, getSiteSettings, jsonError, requireAdmin } from "@/lib/serverApi";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ settings: await getSiteSettings() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = (await request.json()) as Record<string, unknown>;
    const siteName = typeof (body.siteName ?? body.site_name) === "string"
      ? String(body.siteName ?? body.site_name).trim().slice(0, 100)
      : "";
    const siteTagline = typeof (body.siteTagline ?? body.site_tagline) === "string"
      ? String(body.siteTagline ?? body.site_tagline).trim().slice(0, 180)
      : "";
    const rupiahPerToken = Number(body.rupiahPerToken ?? body.conversion_rate_idr_to_token);
    const minimumDonationAmount = Number(body.minimumDonationAmount ?? body.min_donation_amount);
    const contributorRewardTokens = Number(body.contributorRewardTokens ?? body.contributor_reward_tokens ?? 1);
    const maxTopUpTokens = Number(body.maxTopUpTokens ?? body.max_top_up_tokens ?? 10000);
    const maintenanceMode = body.maintenanceMode ?? body.maintenance_mode;
    const qrisImageUrl = typeof body.qrisImageUrl === "string" ? body.qrisImageUrl.trim() : "";
    const qrisMerchantName = typeof body.qrisMerchantName === "string"
      ? body.qrisMerchantName.trim().slice(0, 100)
      : "";
    const githubStorageRepo = typeof (body.githubStorageRepo ?? body.github_storage_repo) === "string"
      ? String(body.githubStorageRepo ?? body.github_storage_repo).trim()
      : "";
    const baseUrlsInput = body.baseUrls ?? body.base_urls;
    const baseUrls = typeof baseUrlsInput === "object" && baseUrlsInput !== null
      ? baseUrlsInput as Record<string, unknown>
      : {};
    const baseUrlsResult: Record<string, string> = {};
    for (const key of ["schematic", "firmware", "tools", "tutorials"] as const) {
      const value = baseUrls[key];
      if (typeof value !== "string") {
        throw new ApiError(`URL subdomain ${key} harus diisi.`, 400);
      }
      let url: URL;
      try {
        url = new URL(value);
      } catch {
        throw new ApiError(`URL subdomain ${key} tidak valid.`, 400);
      }
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.port ||
        (url.hostname !== "r17repair.my.id" && !url.hostname.endsWith(".r17repair.my.id"))
      ) {
        throw new ApiError(`URL subdomain ${key} harus berada di domain R17 dan menggunakan HTTPS.`, 400);
      }
      baseUrlsResult[key] = url.origin;
    }

    if (!siteName || !siteTagline || !Number.isSafeInteger(rupiahPerToken) || rupiahPerToken < 1 || rupiahPerToken > 100000000) {
      throw new ApiError("Nama situs atau kurs token tidak valid.", 400);
    }
    if (
      !Number.isSafeInteger(minimumDonationAmount) ||
      minimumDonationAmount < 0 ||
      minimumDonationAmount > 1000000000
    ) {
      throw new ApiError("Nominal minimum donasi tidak valid.", 400);
    }
    if (!Number.isSafeInteger(contributorRewardTokens) || contributorRewardTokens < 0 || contributorRewardTokens > 1000) {
      throw new ApiError("Komisi contributor harus antara 0 dan 1000 token.", 400);
    }
    if (!Number.isSafeInteger(maxTopUpTokens) || maxTopUpTokens < 1 || maxTopUpTokens > 1000000) {
      throw new ApiError("Batas top-up tidak valid.", 400);
    }
    if (typeof maintenanceMode !== "boolean") {
      throw new ApiError("Status maintenance harus berupa boolean.", 400);
    }
    if (qrisImageUrl) {
      let url: URL;
      try {
        url = new URL(qrisImageUrl);
      } catch {
        throw new ApiError("URL QRIS tidak valid.", 400);
      }
      if (url.protocol !== "https:") throw new ApiError("Gambar QRIS harus menggunakan HTTPS.", 400);
    }
    if (githubStorageRepo) {
      let url: URL;
      try {
        url = new URL(githubStorageRepo);
      } catch {
        throw new ApiError("URL repository GitHub tidak valid.", 400);
      }
      if (
        url.protocol !== "https:" ||
        (url.hostname !== "raw.githubusercontent.com" && url.hostname !== "github.com")
      ) {
        throw new ApiError("Repository penyimpanan harus URL GitHub HTTPS.", 400);
      }
    }

    const settings = {
      site_name: siteName,
      site_tagline: siteTagline,
      conversion_rate_idr_to_token: rupiahPerToken,
      min_donation_amount: minimumDonationAmount,
      contributor_reward_tokens: contributorRewardTokens,
      max_top_up_tokens: maxTopUpTokens,
      maintenance_mode: maintenanceMode,
      qris_image_url: qrisImageUrl,
      qris_merchant_name: qrisMerchantName || "DANA Bisnis R17 Repair",
      github_storage_repo: githubStorageRepo,
      base_urls: baseUrlsResult,
      updated_at: new Date().toISOString(),
      updated_by: admin.token.uid,
    };
    await databaseRef("settings").update(settings);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return jsonError(error);
  }
}
