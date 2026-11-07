import { auth } from "@/lib/firebase";

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Silakan masuk untuk melanjutkan.");

  const idToken = await user.getIdToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${idToken}`);
  const response = await fetch(path, {
    ...init,
    headers,
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Permintaan gagal diproses.");
  return result;
}
