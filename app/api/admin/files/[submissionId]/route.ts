import { NextResponse } from "next/server";
import { ApiError, databaseRef, jsonError, requireAdmin } from "@/lib/serverApi";

type RouteContext = { params: Promise<{ submissionId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { submissionId } = await context.params;
    const body = (await request.json()) as { action?: unknown; tokenCost?: unknown };
    if (body.action !== "approve" && body.action !== "reject") {
      throw new ApiError("Aksi berkas tidak valid.", 400);
    }

    const submissionRef = databaseRef(`files/${submissionId}`);
    const snapshot = await submissionRef.get();
    const submission = snapshot.val() as Record<string, unknown> | null;
    if (!submission || submission.status !== "pending") {
      throw new ApiError("Pengajuan berkas tidak ditemukan atau sudah diproses.", 409);
    }

    if (body.action === "approve") {
      const tokenCost = Number(body.tokenCost);
      if (!Number.isSafeInteger(tokenCost) || tokenCost < 0 || tokenCost > 100000) {
        throw new ApiError("Biaya token harus bilangan bulat antara 0 dan 100000.", 400);
      }
      const result = await submissionRef.transaction((current) => {
        if (
          !current ||
          current.status !== "pending" ||
          current.contributor_id !== submission.contributor_id
        ) return;
        return {
          ...current,
          token_cost: tokenCost,
          status: "published",
          file_name: submission.file_name,
          approved_at: new Date().toISOString(),
          approved_by: admin.token.uid,
          updated_at: new Date().toISOString(),
        };
      });
      if (!result.committed || result.snapshot.val()?.status !== "published") {
        throw new ApiError("Pengajuan sudah diproses.", 409);
      }
    }

    if (body.action === "reject") {
      const result = await submissionRef.transaction((current) => {
        if (!current || current.status !== "pending") return;
        return {
          ...current,
          status: "rejected",
          reviewedBy: admin.token.uid,
          reviewedAt: Date.now(),
        };
      });
      if (!result.committed) throw new ApiError("Pengajuan sudah diproses.", 409);
    }
    const updated = await submissionRef.get();
    return NextResponse.json({ success: true, status: updated.val()?.status });
  } catch (error) {
    return jsonError(error);
  }
}
