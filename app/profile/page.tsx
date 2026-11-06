// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { auth, database } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import Link from "next/link";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      setUser(currentUser);
      setProfile(null);
      setLoadError(null);
      setLoading(true);

      if (currentUser) {
        const userRef = ref(database, `users/${currentUser.uid}`);
        unsubscribeProfile = onValue(
          userRef,
          (snapshot) => {
            setProfile(snapshot.exists() ? snapshot.val() : null);
            setLoading(false);
          },
          (error) => {
            console.error("Gagal memuat profil teknisi:", error);
            setLoadError("Data profil tidak dapat dimuat. Periksa koneksi dan izin Firebase.");
            setLoading(false);
          },
        );
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-bold text-slate-600">Memuat data profil teknisi...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-sm text-slate-600 font-medium">Anda belum masuk. Silakan login terlebih dahulu.</p>
        <Link href="/" className="bg-[#0066cc] text-white text-xs font-bold px-4 py-2 rounded-lg">
          ← Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#002b66] text-white py-6 px-8 shadow">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-extrabold uppercase tracking-wide">👤 Profil Teknisi</h1>
          <Link href="/" className="bg-[#0066cc] hover:bg-[#0055aa] text-white text-xs font-bold px-4 py-2 rounded-lg transition">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>

      {/* Kartu Detail User */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {loadError && (
          <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {loadError}
          </p>
        )}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          {user.photoURL && (
            <img src={user.photoURL} alt="Foto Profil" className="w-20 h-20 rounded-full border-2 border-[#0066cc]" />
          )}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold text-[#002b66]">{profile?.name || user.displayName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{profile?.email || user.email}</p>
            
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start items-center">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase bg-sky-100 text-sky-800">
                Status Akun: {profile?.role || "Free Member"}
              </span>
              {profile?.role === "vip" ? (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase bg-emerald-100 text-emerald-800">
                  Akses VIP Aktif ⭐
                </span>
              ) : (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase bg-amber-100 text-amber-800">
                  Free Member (Terbatas)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}