import { ApiError, databaseRef } from "@/lib/serverApi";

export async function applyWalletChange(
  uid: string,
  transactionId: string,
  delta: number,
  reason: string,
  metadata: Record<string, string | number>,
) {
  if (!Number.isSafeInteger(delta)) {
    throw new ApiError("Perubahan token tidak valid.", 500);
  }
  const walletRef = databaseRef(`users/${uid}/wallet`);
  let failure: "invalid_balance" | "insufficient_tokens" | null = null;
  const result = await walletRef.transaction((current) => {
    const wallet =
      current && typeof current === "object"
        ? current as {
            tokens?: number;
            total_donated?: number;
            ledger?: Record<string, unknown>;
            updatedAt?: number;
          }
        : { tokens: 0, ledger: {} };
    const ledger = wallet.ledger ?? {};

    if (ledger[transactionId]) return wallet;

    const balance = Number(wallet.tokens);
    if (!Number.isSafeInteger(balance) || balance < 0) {
      failure = "invalid_balance";
      return;
    }
    if (delta < 0 && balance < Math.abs(delta)) {
      failure = "insufficient_tokens";
      return;
    }

    return {
      ...wallet,
      tokens: balance + delta,
      total_donated:
        reason === "topup" && typeof metadata.amount_idr === "number"
          ? (Number(wallet.total_donated) || 0) + metadata.amount_idr
          : wallet.total_donated,
      updatedAt: Date.now(),
      ledger: {
        ...ledger,
        [transactionId]: {
          delta,
          reason,
          ...metadata,
          createdAt: Date.now(),
        },
      },
    };
  });

  if (!result.committed) {
    if (failure === "invalid_balance") {
      throw new ApiError("Saldo token pada wallet tidak valid. Hubungi administrator.", 500);
    }
    throw new ApiError("Token tidak mencukupi untuk transaksi ini.", 402);
  }
  return result.snapshot.val() as { tokens: number };
}
