import { connection, NextResponse } from "next/server";
import { getSiteSettings, jsonError } from "@/lib/serverApi";

export async function GET(request: Request) {
  await connection();
  try {
    const headers = new Headers({ "Cache-Control": "no-store" });
    if (request.headers.has("origin")) headers.set("Vary", "Origin");
    return NextResponse.json({ settings: await getSiteSettings() }, { headers });
  } catch (error) {
    return jsonError(error);
  }
}
