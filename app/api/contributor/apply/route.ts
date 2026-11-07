import { NextResponse } from "next/server";
import { ApiError, databaseRef, jsonError, requireUser } from "@/lib/serverApi";

export async function POST(request: Request) {
  try {
    const { token, profile } = await requireUser(request);
    const body = (await request.json()) as { reason?: unknown; specialties?: unknown };
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : "";
    const specialties = typeof body.specialties === "string" ? body.specialties.trim().slice(0, 300) : "";
    if (reason.length < 20) throw new ApiError("Ceritakan pengalaman dan alasan (minimal 20 karakter).", 400);
    if (profile.role === "admin" || profile.role === "contributor") {
      throw new ApiError("Akun Anda sudah memiliki akses kontributor.", 409);
    }
    if (profile.contributorStatus === "pending") {
      throw new ApiError("Pengajuan Anda masih menunggu pemeriksaan admin.", 409);
    }

    const now = Date.now();
    const profileRef = databaseRef(`users/${token.uid}/profile`);
    const result = await profileRef.transaction((current) => {
      if (!current) return;
      if (current.role === "contributor" || current.role === "admin") return;
      if (current.contributorStatus === "pending") return;
      return {
        ...current,
        contributorStatus: "pending",
        contributorApplicationReason: reason,
        contributorSpecialties: specialties,
        contributorAppliedAt: now,
        updatedAt: now,
      };
    });
    if (!result.committed) {
      throw new ApiError("Pengajuan tidak dapat dibuat karena status akun berubah.", 409);
    }
    return NextResponse.json({ success: true, status: "pending" }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
