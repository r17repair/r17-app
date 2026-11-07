// components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, User } from "firebase/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Gagal login:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50">
        <p className="text-xs font-bold tracking-wide text-slate-600">MEMERIKSA SESI TEKNISI...</p>
      </div>
    );
  }

  // Jika belum login, cegah akses dan tampilkan tombol login wajib
  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-10 text-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-lg font-black text-sky-700">
            R17
          </div>
          <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">Akses Terbatas Teknisi</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Anda wajib melakukan *login* menggunakan akun Google terlebih dahulu untuk mengakses Firmware, Schematic, Tools, dan Direktori Servis R17 di Vercel App.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleLogin}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-xs font-bold text-white transition hover:bg-sky-700"
            >
              🔑 Login dengan Google Teknisi
            </button>
            <a
              href="https://r17repair.my.id"
              className="py-1 text-xs font-bold text-slate-500 transition hover:text-sky-700"
            >
              ← Kembali ke Landing Page (Blogspot)
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}