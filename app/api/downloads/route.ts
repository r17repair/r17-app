import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  ApiError,
  allowedPublicAssetURL,
  databaseRef,
  ensureAvailable,
  getSiteSettings,
  jsonError,
  normalizeFileCategory,
  requireUser,
} from "@/lib/serverApi";
import { applyWalletChange } from "@/lib/wallet";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function trustedDownloadURL(file: Record<string, unknown>, settings: Awaited<ReturnType<typeof getSiteSettings>>) {
  let candidate = typeof file.download_url === "string"
    ? file.download_url
    : typeof file.downloadUrl === "string"
      ? file.downloadUrl
      : "";

  if (!candidate && typeof file.github_raw_path === "string" && settings.githubStorageRepo) {
    const segments = file.github_raw_path.split("/");
    if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
      throw new ApiError("Jalur berkas GitHub tidak valid.", 400);
    }
    const base = settings.githubStorageRepo.endsWith("/")
      ? settings.githubStorageRepo
      : `${settings.githubStorageRepo}/`;
    candidate = new URL(segments.map(encodeURIComponent).join("/"), base).toString();
  }

  if (!candidate && typeof file.github_file_path === "string") candidate = file.github_file_path;
  if (!candidate && typeof file.githubUrl === "string") candidate = file.githubUrl;
  if (!candidate) throw new ApiError("Tautan unduhan file belum tersedia.", 404);

  const allowedURL = allowedPublicAssetURL(candidate, settings);
  if (!allowedURL) {
    throw new ApiError("URL unduhan harus memakai HTTPS dan domain penyimpanan R17 yang diizinkan.", 400);
  }
  return allowedURL;
}

export async function POST(request: Request) {
  try {
    const { token } = await requireUser(request);
    const settings = await ensureAvailable();
    const body = (await request.json()) as {
      category?: unknown;
      fileId?: unknown;
      operationId?: unknown;
    };
    const category = normalizeFileCategory(body.category);
    if (typeof body.fileId !== "string" || !/^[A-Za-z0-9_-]{1,120}$/.test(body.fileId)) {
      throw new ApiError("ID file tidak valid.", 400);
    }

    const operationId =
      typeof body.operationId === "string" &&
      /^[A-Za-z0-9_-]{12,80}$/.test(body.operationId)
        ? body.operationId
        : randomUUID();
    const fileRef = databaseRef(`files/${body.fileId}`);
    const fileSnapshot = await fileRef.get();
    const file = fileSnapshot.val() as Record<string, unknown> | null;
    if (
      !file ||
      file.status === "pending" ||
      file.status === "rejected" ||
      categoryKey(file.subdomain_type ?? file.category) !== category
    ) {
      throw new ApiError("File tidak ditemukan atau belum dipublikasikan.", 404);
    }

    const downloadURL = trustedDownloadURL(file, settings);
    const cost = Number(file.token_cost ?? file.tokenCost ?? 0);
    if (!Number.isSafeInteger(cost) || cost < 0) {
      throw new ApiError("Harga token pada metadata file tidak valid.", 500);
    }

    const logRef = databaseRef(`download_logs/${operationId}`);
    const lock = await logRef.transaction((current) => {
      if (current) {
        if (current.user_id !== token.uid || current.file_id !== body.fileId) return;
        if (current.status === "complete") return current;
        if (current.status === "processing" && Number(current.lease_until) > Date.now()) return;
      }
      const previousCost = isRecord(current) ? Number(current.tokens_deducted) : NaN;
      return {
        ...(isRecord(current) ? current : {}),
        user_id: token.uid,
        file_id: body.fileId,
        tokens_deducted: Number.isSafeInteger(previousCost) && previousCost >= 0 ? previousCost : cost,
        status: "processing",
        operation_id: operationId,
        lease_until: Date.now() + 60_000,
        timestamp: new Date().toISOString(),
      };
    });
    if (!lock.committed) throw new ApiError("ID unduhan telah digunakan untuk permintaan lain.", 409);

    const lockedLog = lock.snapshot.val() as {
      status?: string;
      user_id?: string;
      file_id?: string;
      tokens_deducted?: number;
    } | null;
    if (!lockedLog || lockedLog.user_id !== token.uid || lockedLog.file_id !== body.fileId) {
      throw new ApiError("Log unduhan tidak valid.", 409);
    }
    const chargedTokens = Number(lockedLog.tokens_deducted);
    if (!Number.isSafeInteger(chargedTokens) || chargedTokens < 0) {
      throw new ApiError("Jumlah token pada log unduhan tidak valid.", 500);
    }

    if (lockedLog.status !== "complete") {
      try {
        await applyWalletChange(
          token.uid,
          `download:${operationId}`,
          -chargedTokens,
          "download",
          { file_id: body.fileId, log_id: operationId },
        );

        const contributorId = file.contributor_id ?? file.contributorUid;
        const reward = chargedTokens > 0 && typeof contributorId === "string" && contributorId !== token.uid
          ? Number.isSafeInteger(file.contributor_reward_tokens)
            ? Number(file.contributor_reward_tokens)
            : settings.contributorRewardTokens
          : 0;
        if (reward > 0 && typeof contributorId === "string") {
          await applyWalletChange(
            contributorId,
            `commission:${operationId}`,
            reward,
            "contributor_commission",
            { file_id: body.fileId, download_log_id: operationId },
          );
        }

        await fileRef.transaction((current) => {
          if (!isRecord(current)) return current;
          const receipts = isRecord(current.counted_downloads) ? current.counted_downloads : {};
          if (receipts[operationId]) return current;
          return {
            ...current,
            downloads_count: (Number(current.downloads_count ?? current.downloadCount) || 0) + 1,
            counted_downloads: { ...receipts, [operationId]: true },
          };
        });

        await logRef.transaction((current) => {
          if (
            !isRecord(current) ||
            current.user_id !== token.uid ||
            current.file_id !== body.fileId ||
            current.status === "complete"
          ) return current;
          return {
            ...current,
            status: "complete",
            completed_at: new Date().toISOString(),
            contributor_reward_tokens: reward,
            lease_until: null,
          };
        });
      } catch (error) {
        await logRef.transaction((current) => {
          if (!isRecord(current) || current.operation_id !== operationId || current.status === "complete") {
            return current;
          }
          return {
            ...current,
            status: error instanceof ApiError && error.status === 402 ? "insufficient_tokens" : "retryable_error",
            lease_until: null,
          };
        });
        throw error;
      }
    }

    const [walletSnapshot, finalLog] = await Promise.all([
      databaseRef(`users/${token.uid}/wallet/tokens`).get(),
      logRef.get(),
    ]);
    if ((finalLog.val() as { status?: string } | null)?.status !== "complete") {
      throw new ApiError("Transaksi unduhan belum selesai. Silakan coba kembali.", 503);
    }
    return NextResponse.json({
      success: true,
      downloadURL,
      tokensCharged: chargedTokens,
      balance: Number(walletSnapshot.val()) || 0,
    });
  } catch (error) {
    return jsonError(error);
  }
}
