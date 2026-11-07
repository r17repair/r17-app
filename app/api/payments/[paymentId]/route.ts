import { NextResponse } from "next/server";
import { ApiError, databaseRef, jsonError, requireUser } from "@/lib/serverApi";

type RouteContext = { params: Promise<{ paymentId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { token } = await requireUser(request);
    const { paymentId } = await context.params;
    const body = (await request.json()) as { reference?: unknown; proofUrl?: unknown };
    const reference = typeof body.reference === "string" ? body.reference.trim().slice(0, 100) : "";
    const proofUrl = typeof body.proofUrl === "string" ? body.proofUrl.trim() : "";
    if (reference.length < 4) {
      throw new ApiError("Nomor referensi minimal 4 karakter.", 400);
    }
    if (proofUrl) {
      let url: URL;
      try {
        url = new URL(proofUrl);
      } catch {
        throw new ApiError("URL bukti pembayaran tidak valid.", 400);
      }
      if (url.protocol !== "https:") throw new ApiError("Bukti pembayaran harus berupa URL HTTPS.", 400);
    }

    const transactionRef = databaseRef(`transactions/${paymentId}`);
    const snapshot = await transactionRef.get();
    const donation = snapshot.val() as {
      user_id?: string;
      status?: string;
      expires_at?: number;
    } | null;
    if (!donation || donation.user_id !== token.uid) {
      throw new ApiError("Transaksi tidak ditemukan.", 404);
    }
    if (donation.status !== "pending" || Number(donation.expires_at) <= Date.now()) {
      throw new ApiError("Transaksi tidak lagi dapat diperbarui.", 409);
    }

    const updateResult = await transactionRef.transaction((current) => {
      if (
        !current ||
        current.user_id !== token.uid ||
        current.status !== "pending" ||
        Number(current.expires_at) <= Date.now()
      ) return;
      return {
        ...current,
        payment_reference: reference,
        proof_url: proofUrl || null,
        submitted_at: new Date().toISOString(),
      };
    });
    if (!updateResult.committed) {
      throw new ApiError("Transaksi sudah berubah atau kedaluwarsa.", 409);
    }
    const updatedDonation = updateResult.snapshot.val() as { amount_idr?: number } | null;
    if (updatedDonation && Number.isSafeInteger(updatedDonation.amount_idr)) {
      await databaseRef(`payment_amount_reservations/${updatedDonation.amount_idr}`)
        .transaction((current) => {
          if (!current || current.transaction_id !== paymentId) return current;
          return { ...current, status: "submitted", expires_at: Number.MAX_SAFE_INTEGER };
        });
    }
    return NextResponse.json({ success: true, status: "pending" });
  } catch (error) {
    return jsonError(error);
  }
}
