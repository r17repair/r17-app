import { NextResponse } from "next/server";
import { ApiError, databaseRef, jsonError, requireAdmin } from "@/lib/serverApi";
import { applyWalletChange } from "@/lib/wallet";

type RouteContext = { params: Promise<{ paymentId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { paymentId } = await context.params;
    if (!/^[A-Za-z0-9_-]{1,120}$/.test(paymentId)) {
      throw new ApiError("ID transaksi tidak valid.", 400);
    }

    const body = (await request.json()) as { action?: unknown };
    if (body.action !== "approve" && body.action !== "reject") {
      throw new ApiError("Aksi transaksi tidak valid.", 400);
    }
    const transactionRef = databaseRef(`transactions/${paymentId}`);
    const result = await transactionRef.transaction((current) => {
      if (!current || current.type !== "donation_topup") return;
      if (body.action === "approve") {
        if (current.status === "success") return current;
        if (current.status === "processing_approval") return current;
        if (current.status !== "pending" || typeof current.payment_reference !== "string") return;
        return {
          ...current,
          status: "processing_approval",
          approved_by: admin.token.uid,
          approval_started_at: new Date().toISOString(),
        };
      }
      if (current.status !== "pending") return;
      return {
        ...current,
        status: "rejected",
        rejected_by: admin.token.uid,
        rejected_at: new Date().toISOString(),
      };
    });

    if (!result.committed) {
      throw new ApiError(
        body.action === "approve"
          ? "Transaksi harus berstatus menunggu dan memiliki referensi pembayaran."
          : "Transaksi tidak lagi menunggu pemeriksaan.",
        409,
      );
    }
    const transaction = result.snapshot.val() as {
      user_id?: string;
      tokens_received?: number;
      amount_idr?: number;
      status?: string;
    } | null;
    if (!transaction) throw new ApiError("Transaksi tidak ditemukan.", 404);

    if (body.action === "approve" && transaction.status !== "success") {
      if (
        !transaction.user_id ||
        !Number.isSafeInteger(transaction.tokens_received) ||
        Number(transaction.tokens_received) < 1 ||
        !Number.isSafeInteger(transaction.amount_idr) ||
        Number(transaction.amount_idr) < 0
      ) {
        throw new ApiError("Data transaksi tidak lengkap atau tidak valid.", 500);
      }
      await applyWalletChange(
        transaction.user_id,
        `topup:${paymentId}`,
        Number(transaction.tokens_received),
        "topup",
        { transaction_id: paymentId, amount_idr: Number(transaction.amount_idr) },
      );
      await transactionRef.transaction((current) => {
        if (!current || current.status === "success") return current;
        if (current.status !== "processing_approval") return;
        return {
          ...current,
          status: "success",
          approved_at: new Date().toISOString(),
        };
      });
    }

    const updated = await transactionRef.get();
    const updatedTransaction = updated.val() as {
      status?: string;
      amount_idr?: number;
    } | null;
    if (
      (updatedTransaction?.status === "success" || updatedTransaction?.status === "rejected") &&
      Number.isSafeInteger(updatedTransaction.amount_idr)
    ) {
      await databaseRef(`payment_amount_reservations/${updatedTransaction.amount_idr}`)
        .transaction((current) => {
          if (!current || current.transaction_id !== paymentId) return current;
          return { ...current, status: "released", expires_at: Date.now() };
        });
    }
    return NextResponse.json({ success: true, status: updatedTransaction?.status });
  } catch (error) {
    return jsonError(error);
  }
}
