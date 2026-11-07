import { connection, NextResponse } from "next/server";
import { databaseRef, jsonError, requireUser } from "@/lib/serverApi";

export async function GET(request: Request) {
  await connection();
  try {
    const { token, profile } = await requireUser(request);
    const [walletSnapshot, filesSnapshot] = await Promise.all([
      databaseRef(`users/${token.uid}/wallet`).get(),
      databaseRef("files").orderByChild("contributor_id").equalTo(token.uid).get(),
    ]);
    const wallet = walletSnapshot.val() ?? { balance: 0 };
    return NextResponse.json({
      profile,
      wallet: { tokens: Number(wallet.tokens) || 0 },
      contributorApplication:
        profile.contributorStatus === "pending"
          ? {
              status: "pending",
              reason: profile.contributorApplicationReason ?? "",
              specialties: profile.contributorSpecialties ?? "",
            }
          : null,
      fileSubmissions: Object.entries(filesSnapshot.val() ?? {}).map(([id, value]) => ({
        id,
        ...(value as object),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { token } = await requireUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const workshopName =
      typeof body.workshopName === "string" ? body.workshopName.trim().slice(0, 100) : "";
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : "";

    await databaseRef(`users/${token.uid}/profile`).update({
      workshopName,
      phone,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
