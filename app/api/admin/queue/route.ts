import { connection, NextResponse } from "next/server";
import { databaseRef, getSiteSettings, jsonError, requireAdmin } from "@/lib/serverApi";

function entriesWithId(value: unknown): Array<Record<string, unknown> & { id: string }> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [];
  return Object.entries(value).map(([id, item]) => ({
    id,
    ...(typeof item === "object" && item !== null ? item : {}),
  }));
}

export async function GET(request: Request) {
  await connection();
  try {
    await requireAdmin(request);
    const [pendingSnapshot, processingSnapshot, usersSnapshot, filesSnapshot, settings] = await Promise.all([
      databaseRef("transactions").orderByChild("status").equalTo("pending").get(),
      databaseRef("transactions").orderByChild("status").equalTo("processing_approval").get(),
      databaseRef("users").get(),
      databaseRef("files").orderByChild("status").equalTo("pending").get(),
      getSiteSettings(),
    ]);

    const pendingTransactions = [
      ...entriesWithId(pendingSnapshot.val()),
      ...entriesWithId(processingSnapshot.val()),
    ];
    await Promise.all(pendingTransactions.map(async (transaction) => {
      if (
        transaction.type !== "donation_topup" ||
        transaction.status !== "pending" ||
        transaction.payment_reference ||
        Number(transaction.expires_at) > Date.now()
      ) return;
      const expired = await databaseRef(`transactions/${transaction.id}`).transaction((current) => {
        if (
          !current ||
          current.status !== "pending" ||
          current.payment_reference ||
          Number(current.expires_at) > Date.now()
        ) return current;
        return { ...current, status: "expired", expired_at: new Date().toISOString() };
      });
      const currentStatus = (expired.snapshot.val() as { status?: string } | null)?.status;
      if (currentStatus) transaction.status = currentStatus;
    }));

    const userProfiles = entriesWithId(usersSnapshot.val()).flatMap((user) => {
      const profile = user.profile;
      if (typeof profile !== "object" || profile === null) return [];
      const record = profile as Record<string, unknown>;
      if (record.contributorStatus !== "pending") return [];
      return [{
        uid: user.id,
        ...record,
        name: record.name ?? "",
        email: record.email ?? "",
        reason: record.contributorApplicationReason ?? "",
        specialties: record.contributorSpecialties ?? "",
      }];
    });

    const donations = pendingTransactions
      .filter((transaction) =>
        transaction.type === "donation_topup" &&
        (transaction.status === "processing_approval" ||
          (transaction.status === "pending" &&
            (Boolean(transaction.payment_reference) || Number(transaction.expires_at) > Date.now()))),
      )
      .map((transaction) => ({
        ...transaction,
        uid: transaction.user_id,
        tokens: transaction.tokens_received,
        amount: transaction.amount_idr,
        reference: transaction.payment_reference ?? null,
        proofUrl: transaction.proof_url ?? null,
      }));

    return NextResponse.json({
      donations,
      applications: userProfiles,
      submissions: entriesWithId(filesSnapshot.val()),
      settings,
    });
  } catch (error) {
    return jsonError(error);
  }
}
