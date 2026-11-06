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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xs font-bold text-slate-600 tracking-wide">MEMERIKSA SESI TEKNISI...</p>
      </div>
    );
  }

  // Jika belum login, cegah akses dan tampilkan tombol login wajib
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full">
          <div className="bg-[#0066cc] text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 font-black text-lg">
            R17
          </div>
          <h2 className="text-base font-extrabold text-[#002b66] uppercase tracking-wide">Akses Terbatas Teknisi</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Anda wajib melakukan *login* menggunakan akun Google terlebih dahulu untuk mengakses Firmware, Schematic, Tools, dan Direktori Servis R17 di Vercel App.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleLogin}
              className="w-full bg-[#0099ff] hover:bg-[#007acc] text-white text-xs font-bold py-3 rounded-xl transition shadow cursor-pointer flex items-center justify-center gap-2"
            >
              🔑 Login dengan Google Teknisi
            </button>
            <a
              href="https://r17repair.my.id"
              className="text-xs font-bold text-slate-500 hover:text-[#0066cc] transition py-1"
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