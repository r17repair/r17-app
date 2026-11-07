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
  role: "member" | "contributor" | "admin";
  createdAt: string;
  contributorStatus?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      setUser(currentUser);
      setProfile(null);
      setTokenBalance(0);
      setLoadError(null);
      setLoading(true);

      if (currentUser) {
        const userRef = ref(database, `users/${currentUser.uid}/profile`);
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
        const unsubscribeWallet = onValue(
          ref(database, `users/${currentUser.uid}/wallet/tokens`),
          (snapshot) => setTokenBalance(typeof snapshot.val() === "number" ? snapshot.val() : 0),
          (error) => console.error("Gagal memuat saldo token:", error),
        );
        const existingCleanup = unsubscribeProfile;
        unsubscribeProfile = () => {
          existingCleanup();
          unsubscribeWallet();
        };
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribe();
    };
  }, []);

  const role =
    profile?.role === "admin" || profile?.role === "contributor"
      ? profile.role
      : "member";

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50">
        <p className="text-sm font-bold text-slate-600">Memuat data profil teknisi...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-slate-50">
        <p className="text-sm text-slate-600 font-medium">Anda belum masuk. Silakan login terlebih dahulu.</p>
        <Link href="/" className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-700">
          ← Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Profil Teknisi</h1>
          <Link href="/" className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-700">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>

      {/* Kartu Detail User */}
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        {loadError && (
          <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {loadError}
          </p>
        )}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          {user.photoURL && (
            <img src={user.photoURL} alt="Foto Profil" className="h-20 w-20 rounded-full border-2 border-sky-600" />
          )}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold text-slate-900">{profile?.name || user.displayName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{profile?.email || user.email}</p>
            
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start items-center">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase bg-sky-100 text-sky-800">
                Peran: {role}
              </span>
              {profile?.contributorStatus === "pending" && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
                  Pengajuan kontributor menunggu pemeriksaan
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-700">
              Saldo token: <strong className="text-sky-700">{tokenBalance}</strong>
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Link
                href="/tokens"
                className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-700"
              >
                Top-up Token
              </Link>
              <Link
                href="/contributor"
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                Area Kontributor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}