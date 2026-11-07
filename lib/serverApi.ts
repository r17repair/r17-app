import "server-only";
import { NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth, getAdminDatabase } from "@/lib/firebaseAdmin";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  avatar: string | null;
  role: "member" | "contributor" | "admin";
  status: "active" | "suspended";
  joined_at: string;
  updatedAt: number;
  workshopName?: string;
  phone?: string;
  contributorStatus?: "none" | "pending" | "approved" | "rejected";
  contributorApplicationReason?: string;
  contributorSpecialties?: string;
}

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  rupiahPerToken: number;
  minimumDonationAmount: number;
  maintenanceMode: boolean;
  contributorRewardTokens: number;
  qrisImageUrl: string;
  qrisMerchantName: string;
  maxTopUpTokens: number;
  githubStorageRepo: string;
  baseUrls: {
    schematic: string;
    firmware: string;
    tools: string;
    tutorials: string;
  };
}

export interface VaultFile {
  id: string;
  title: string;
  description: string | null;
  category: "firmware" | "schematics" | "tools";
  githubUrl: string | null;
  downloadUrl: string | null;
  viewUrl: string | null;
  tokenCost: number;
  contributorUid: string | null;
  contributorRewardTokens?: number;
  status: "pending" | "published" | "rejected";
  createdAt: number;
  downloadCount?: number;
  [key: string]: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface AuthenticatedUser {
  token: DecodedIdToken;
  profile: UserProfile;
  isAdmin: boolean;
}

const defaults: SiteSettings = {
  siteName: "R17 Repair Vault",
  siteTagline: "Pusat Direktori & Repositori Berkas Perbaikan Ponsel Terverifikasi",
  rupiahPerToken: 1000,
  minimumDonationAmount: 5000,
  maintenanceMode: false,
  contributorRewardTokens: 1,
  qrisImageUrl: process.env.NEXT_PUBLIC_DANA_QRIS_IMAGE_URL ?? "",
  qrisMerchantName: process.env.NEXT_PUBLIC_DANA_MERCHANT_NAME ?? "DANA Bisnis R17 Repair",
  maxTopUpTokens: 10000,
  githubStorageRepo: process.env.GITHUB_STORAGE_REPO ?? "",
  baseUrls: {
    schematic: "https://schematic.r17repair.my.id",
    firmware: "https://firmware.r17repair.my.id",
    tools: "https://tools.r17repair.my.id",
    tutorials: "https://tutorials.r17repair.my.id",
  },
};

export function databaseRef(path: string) {
  return getAdminDatabase().ref(path);
}

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const snapshot = await databaseRef("settings").get();
  const raw = objectValue(snapshot.val());
  const value = objectValue(raw.public ?? raw);
  const setting = (camelCase: string, snakeCase: string) =>
    value[camelCase] ?? value[snakeCase] ?? raw[camelCase] ?? raw[snakeCase];
  const rupiahPerToken = setting("rupiahPerToken", "conversion_rate_idr_to_token");
  const minimumDonationAmount = setting("minimumDonationAmount", "min_donation_amount");
  const contributorRewardTokens = setting("contributorRewardTokens", "contributor_reward_tokens");
  const maxTopUpTokens = setting("maxTopUpTokens", "max_top_up_tokens");
  const baseUrls = objectValue(setting("baseUrls", "base_urls"));
  return {
    siteName: typeof setting("siteName", "site_name") === "string"
      ? String(setting("siteName", "site_name"))
      : defaults.siteName,
    siteTagline: typeof setting("siteTagline", "site_tagline") === "string"
      ? String(setting("siteTagline", "site_tagline"))
      : defaults.siteTagline,
    rupiahPerToken: typeof rupiahPerToken === "number" && Number.isSafeInteger(rupiahPerToken)
      ? rupiahPerToken
      : defaults.rupiahPerToken,
    minimumDonationAmount: typeof minimumDonationAmount === "number" && Number.isSafeInteger(minimumDonationAmount)
      ? minimumDonationAmount
      : defaults.minimumDonationAmount,
    maintenanceMode: typeof setting("maintenanceMode", "maintenance_mode") === "boolean"
      ? Boolean(setting("maintenanceMode", "maintenance_mode"))
      : defaults.maintenanceMode,
    contributorRewardTokens: typeof contributorRewardTokens === "number" && Number.isSafeInteger(contributorRewardTokens)
      ? contributorRewardTokens
      : defaults.contributorRewardTokens,
    qrisImageUrl: typeof setting("qrisImageUrl", "qris_image_url") === "string"
      ? String(setting("qrisImageUrl", "qris_image_url"))
      : defaults.qrisImageUrl,
    qrisMerchantName: typeof setting("qrisMerchantName", "qris_merchant_name") === "string"
      ? String(setting("qrisMerchantName", "qris_merchant_name"))
      : defaults.qrisMerchantName,
    maxTopUpTokens: typeof maxTopUpTokens === "number" && Number.isSafeInteger(maxTopUpTokens)
      ? maxTopUpTokens
      : defaults.maxTopUpTokens,
    githubStorageRepo: typeof setting("githubStorageRepo", "github_storage_repo") === "string"
      ? String(setting("githubStorageRepo", "github_storage_repo"))
      : defaults.githubStorageRepo,
    baseUrls: {
      schematic: typeof baseUrls.schematic === "string" ? baseUrls.schematic : defaults.baseUrls.schematic,
      firmware: typeof baseUrls.firmware === "string" ? baseUrls.firmware : defaults.baseUrls.firmware,
      tools: typeof baseUrls.tools === "string" ? baseUrls.tools : defaults.baseUrls.tools,
      tutorials: typeof baseUrls.tutorials === "string" ? baseUrls.tutorials : defaults.baseUrls.tutorials,
    },
  };
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("Kesalahan API R17:", error);
  return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
}

export async function requireUser(request: Request): Promise<AuthenticatedUser> {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer (.+)$/i);
  if (!match) throw new ApiError("Silakan masuk untuk melanjutkan.", 401);

  let token: DecodedIdToken;
  try {
    token = await getAdminAuth().verifyIdToken(match[1]);
  } catch {
    throw new ApiError("Sesi tidak valid atau telah kedaluwarsa. Silakan masuk kembali.", 401);
  }

  const profileRef = databaseRef(`users/${token.uid}/profile`);
  const now = Date.now();
  const userRef = databaseRef(`users/${token.uid}`);
  const [profileSnapshot, legacySnapshot] = await Promise.all([
    profileRef.get(),
    userRef.get(),
  ]);
  const legacyUser = legacySnapshot.val() as Record<string, unknown> | null;
  const legacyProfile = legacyUser && !legacyUser.profile
    ? {
        uid: legacyUser.uid,
        email: legacyUser.email,
        name: legacyUser.name,
        photoURL: legacyUser.photoURL,
        role: legacyUser.role,
        status: legacyUser.status,
        createdAt: legacyUser.createdAt,
        updatedAt: legacyUser.updatedAt,
        workshopName: legacyUser.workshopName,
        phone: legacyUser.phone,
        contributorStatus: legacyUser.contributorStatus,
        status_approved: legacyUser.status_approved,
      }
    : {};
  const existingProfile = profileSnapshot.val() as Record<string, unknown> | null;
  const adminUIDs = (process.env.FIREBASE_ADMIN_UIDS ?? "")
    .split(",")
    .map((uid) => uid.trim())
    .filter(Boolean);
  const isAdmin = adminUIDs.includes(token.uid) || token.admin === true;
  const preservedRole =
    existingProfile?.role === "contributor" || legacyProfile.role === "contributor"
      ? "contributor"
      : existingProfile?.status_approved === true || legacyProfile.status_approved === true
        ? "contributor"
      : "member";
  const storedProfile = {
    ...(legacyProfile as Record<string, unknown>),
    ...(existingProfile ?? {}),
  };
  const role = isAdmin
    ? "admin"
    : preservedRole;
  const status = storedProfile.status === "suspended" ? "suspended" : "active";
  const profile = await profileRef.transaction((current) => ({
    ...storedProfile,
    ...(current as Record<string, unknown> | null),
    uid: token.uid,
    email: token.email ?? storedProfile.email ?? "",
    name: token.name ?? storedProfile.name ?? "Teknisi",
    avatar: token.picture ?? storedProfile.avatar ?? storedProfile.photoURL ?? null,
    role,
    status,
    joined_at:
      (current as Record<string, unknown> | null)?.joined_at ??
      storedProfile.joined_at ??
      new Date(Number(storedProfile.createdAt) || now).toISOString(),
    updatedAt: now,
    contributorStatus:
      (current as Record<string, unknown> | null)?.contributorStatus ??
      storedProfile.contributorStatus ??
      (storedProfile.status_approved === true || storedProfile.role === "contributor"
        ? "approved"
        : "none"),
  }));
  const profileData = profile.snapshot.val() as UserProfile;
  if (profileData.role !== role || profileData.status !== status) {
    await profileRef.update({ role, status, updatedAt: now });
    profileData.role = role;
    profileData.status = status;
  }
  const walletRef = databaseRef(`users/${token.uid}/wallet`);
  const walletSnapshot = await walletRef.get();
  if (!walletSnapshot.exists()) {
    const legacyWallet = await databaseRef(`wallets/${token.uid}`).get();
    const legacyBalance = Number(legacyWallet.child("balance").val()) || 0;
    await walletRef.transaction((current) =>
      current ?? { tokens: legacyBalance, ledger: {}, updatedAt: now },
    );
  } else if (!walletSnapshot.child("tokens").exists()) {
    const legacyWallet = await databaseRef(`wallets/${token.uid}`).get();
    const legacyBalance = Number(legacyWallet.child("balance").val()) || 0;
    await walletRef.child("tokens").transaction((current) => {
      const balance = Number(current);
      return Number.isSafeInteger(balance) && balance >= 0 ? balance : legacyBalance;
    });
  } else {
    await walletRef.child("tokens").transaction((current) => {
      const balance = Number(current);
      return Number.isSafeInteger(balance) && balance >= 0 ? balance : 0;
    });
  }

  if (profileData.status !== "active" && !isAdmin) {
    throw new ApiError("Akun Anda sedang dinonaktifkan. Hubungi administrator.", 403);
  }

  return { token, profile: profileData, isAdmin };
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (!user.isAdmin) throw new ApiError("Akses administrator diperlukan.", 403);
  return user;
}

export async function ensureAvailable() {
  const settings = await getSiteSettings();
  if (settings.maintenanceMode) {
    throw new ApiError("Vault sedang dalam pemeliharaan.", 503);
  }
  return settings;
}

export function validGitHubURL(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2000) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "github.com" || url.hostname === "raw.githubusercontent.com")
    );
  } catch {
    return false;
  }
}

export function normalizeFileCategory(value: unknown): VaultFile["category"] {
  if (value === "schematic") return "schematics";
  if (value === "firmware" || value === "tools" || value === "schematics") return value;
  throw new ApiError("Kategori file tidak valid.", 400);
}

export function allowedPublicAssetURL(value: unknown, settings: SiteSettings): string | null {
  if (typeof value !== "string" || value.length > 2000) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;

    const webOrigins = [
      ...Object.values(settings.baseUrls),
      "https://r17repair.my.id",
    ].flatMap((base) => {
      try {
        return [new URL(base).origin];
      } catch {
        return [];
      }
    });
    if (webOrigins.includes(url.origin)) return url.toString();
    if (url.hostname !== "raw.githubusercontent.com") return null;

    if (settings.githubStorageRepo) {
      const base = new URL(settings.githubStorageRepo);
      const basePath = base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`;
      if (
        base.pathname.split("/").filter(Boolean).length >= 3 &&
        base.origin === url.origin &&
        url.pathname.startsWith(basePath)
      ) return url.toString();
    }

    const repository = process.env.GITHUB_REPOSITORY?.split("/").filter(Boolean);
    if (
      repository?.length === 2 &&
      url.pathname.startsWith(`/${repository[0]}/${repository[1]}/`)
    ) {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}
