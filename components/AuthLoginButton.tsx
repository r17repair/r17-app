"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export default function AuthLoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
      try {
        const idToken = await currentUser.getIdToken();
        const response = await fetch("/api/account", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!response.ok) throw new Error("Gagal menyiapkan profil R17 Vault.");
      } catch (error) {
        console.error("Gagal menyiapkan profil R17 Vault:", error);
      }
    }
    setLoading(false);
  }), []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  if (loading) {
    return <span className="text-xs text-slate-500">Memuat sesi...</span>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
          {user.photoURL && (
            <img src={user.photoURL} alt="" className="h-6 w-6 rounded-full border border-sky-200" />
          )}
          <span className="max-w-[120px] truncate text-xs font-medium text-slate-700">
            {user.displayName || user.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          Keluar
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex cursor-pointer items-center rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-700"
    >
      Login Teknisi
    </Link>
  );
}
