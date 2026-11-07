import { NextResponse } from "next/server";
import { ApiError, databaseRef, jsonError, requireAdmin } from "@/lib/serverApi";

type RouteContext = { params: Promise<{ uid: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { uid } = await context.params;
    const body = (await request.json()) as { action?: unknown };
    if (body.action !== "approve" && body.action !== "reject") {
      throw new ApiError("Aksi pengajuan kontributor tidak valid.", 400);
    }

    const applicationRef = databaseRef(`users/${uid}/profile`);
    const applicationSnapshot = await applicationRef.get();
    const applicationStatus = applicationSnapshot.val()?.contributorStatus;
    const nextStatus = body.action === "approve" ? "approved" : "rejected";
    if (!applicationSnapshot.exists() || applicationStatus !== "pending") {
      throw new ApiError("Pengajuan tidak ditemukan atau telah diproses.", 409);
    }

    const result = await applicationRef.transaction((current) => {
      if (!current || current.contributorStatus !== "pending") return;
      return {
        ...current,
        role: body.action === "approve" ? "contributor" : "member",
        status_approved: body.action === "approve",
        contributorStatus: nextStatus,
        updatedAt: Date.now(),
        contributorReviewedBy: admin.token.uid,
        contributorReviewedAt: Date.now(),
      };
    });
    if (!result.committed) throw new ApiError("Pengajuan sudah diproses.", 409);
    return NextResponse.json({ success: true, status: nextStatus });
  } catch (error) {
    return jsonError(error);
  }
}
