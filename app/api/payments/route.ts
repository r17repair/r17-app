import { randomInt, randomUUID } from "node:crypto";
import { connection, NextResponse } from "next/server";
import {
  ApiError,
  databaseRef,
  ensureAvailable,
  jsonError,
  requireUser,
} from "@/lib/serverApi";

export async function POST(request: Request) {
  try {
    const { token } = await requireUser(request);
    const settings = await ensureAvailable();
    const body = (await request.json()) as { tokens?: unknown; amountIdr?: unknown };
    const tokensFromAmount = Number(body.amountIdr) / settings.rupiahPerToken;
    const tokens = body.amountIdr !== undefined
      ? Number.isSafeInteger(Number(body.amountIdr)) &&
        Number(body.amountIdr) % settings.rupiahPerToken === 0
        ? tokensFromAmount
        : NaN
      : Number(body.tokens);
    if (!Number.isSafeInteger(tokens) || tokens < 1 || tokens > settings.maxTopUpTokens) {
      throw new ApiError(`Jumlah token harus antara 1 dan ${settings.maxTopUpTokens}.`, 400);
    }

    const baseAmount = tokens * settings.rupiahPerToken;
    if (baseAmount < settings.minimumDonationAmount) {
      throw new ApiError(
        `Minimal top-up adalah ${settings.minimumDonationAmount.toLocaleString("id-ID")} rupiah.`,
        400,
      );
    }

    const transactionId = randomUUID();
    const now = Date.now();
    const transactionsRef = databaseRef("transactions");
    let amount = 0;
    let uniqueCode = 0;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const candidateCode = randomInt(100, 1000);
      const candidateAmount = baseAmount + candidateCode;
      const reservation = await databaseRef(`payment_amount_reservations/${candidateAmount}`)
        .transaction((current) => {
          if (
            current &&
            current.status !== "released" &&
            Number(current.expires_at) > now
          ) return;
          return {
            transaction_id: transactionId,
            expires_at: now + 30 * 60 * 1000,
          };
        });
      if (
        reservation.committed &&
        reservation.snapshot.val()?.transaction_id === transactionId
      ) {
        amount = candidateAmount;
        uniqueCode = candidateCode;
        break;
      }
    }
    if (!amount) throw new ApiError("Nominal unik sedang penuh. Coba kembali.", 503);

    const transaction = {
      id: transactionId,
      user_id: token.uid,
      type: "donation_topup",
      tokens_received: tokens,
      base_amount_idr: baseAmount,
      unique_code: uniqueCode,
      amount_idr: amount,
      currency: "IDR",
      status: "pending",
      payment_gateway: "DANA Bisnis / QRIS",
      payment_reference: null,
      proof_url: null,
      timestamp: new Date(now).toISOString(),
      expires_at: now + 30 * 60 * 1000,
    };
    await transactionsRef.child(transactionId).set(transaction);

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        uid: transaction.user_id,
        type: "topup",
        tokens: transaction.tokens_received,
        baseAmount: transaction.base_amount_idr,
        uniqueCode: transaction.unique_code,
        amount: transaction.amount_idr,
        status: transaction.status,
        reference: transaction.payment_reference,
        createdAt: now,
        expiresAt: transaction.expires_at,
      },
      payment: {
        merchantName: settings.qrisMerchantName,
        qrisImageUrl: settings.qrisImageUrl,
        minimumDonationAmount: settings.minimumDonationAmount,
        rupiahPerToken: settings.rupiahPerToken,
      },
    }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(request: Request) {
  await connection();
  try {
    const { token } = await requireUser(request);
    const snapshot = await databaseRef("transactions")
      .orderByChild("user_id")
      .equalTo(token.uid)
      .get();
    const entries = Object.entries(snapshot.val() ?? {});
    await Promise.all(entries.map(async ([id, value]) => {
      const transaction = value as {
        status?: string;
        expires_at?: number;
        payment_reference?: string | null;
      };
      if (
        transaction.status === "pending" &&
        !transaction.payment_reference &&
        Number(transaction.expires_at) <= Date.now()
      ) {
        const result = await databaseRef(`transactions/${id}`).transaction((current) => {
          if (
            current?.status === "pending" &&
            !current.payment_reference &&
            Number(current.expires_at) <= Date.now()
          ) {
            return { ...current, status: "expired", expired_at: new Date().toISOString() };
          }
          return current;
        });
        const currentStatus = (result.snapshot.val() as { status?: string } | null)?.status;
        if (currentStatus && typeof value === "object" && value !== null) {
          (value as { status?: string }).status = currentStatus;
        }
      }
    }));
    const transactions = entries
      .map(([id, value]) => {
        const transaction = value as {
          user_id?: string;
          type?: string;
          tokens_received?: number;
          amount_idr?: number;
          status?: string;
          payment_reference?: string | null;
          expires_at?: number;
          timestamp?: string;
        };
        return {
          id,
          uid: transaction.user_id,
          type: transaction.type === "donation_topup" ? "topup" : transaction.type,
          tokens: transaction.tokens_received ?? 0,
          amount: transaction.amount_idr ?? 0,
          status: transaction.status ?? "pending",
          reference: transaction.payment_reference ?? null,
          expiresAt: transaction.expires_at ?? 0,
          createdAt: transaction.timestamp
            ? Date.parse(transaction.timestamp)
            : 0,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json({ transactions });
  } catch (error) {
    return jsonError(error);
  }
}
