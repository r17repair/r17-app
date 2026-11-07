// app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { auth, database } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { apiRequest } from "@/lib/clientApi";
import Link from "next/link";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [workshopName, setWorkshopName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [role, setRole] = useState<string>("member");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      setUser(currentUser);
      setLoadError(null);
      setLoading(true);

      if (currentUser) {
        const userRef = ref(database, `users/${currentUser.uid}/profile`);
        unsubscribeProfile = onValue(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              setWorkshopName(data.workshopName || "");
              setPhone(data.phone || "");
              setRole(data.role === "admin" || data.role === "contributor" ? data.role : "member");
            } else {
              setWorkshopName("");
              setPhone("");
              setRole("member");
            }
            setLoading(false);
          },
          (error) => {
            console.error("Gagal memuat pengaturan profil:", error);
            setLoadError("Data pengaturan tidak dapat dimuat. Periksa koneksi dan izin Firebase.");
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      await apiRequest("/api/account", {
        method: "PATCH",
        body: JSON.stringify({
          workshopName,
          phone,
        }),
      });
      setMessage("Pengaturan profil berhasil disimpan!");
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      setMessage("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50">
        <p className="text-sm font-bold text-slate-600">Memuat pengaturan akun...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-slate-50">
        <p className="text-sm text-slate-600 font-medium">Silakan login terlebih dahulu untuk mengakses halaman ini.</p>
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
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Pengaturan Akun Teknisi</h1>
          <Link href="/" className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-700">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>

      {/* Form Pengaturan */}
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            {user.photoURL && (
              <img src={user.photoURL} alt="Avatar" className="w-16 h-16 rounded-full border border-sky-400" />
            )}
            <div>
              <h2 className="font-bold text-slate-800 text-base">{user.displayName}</h2>
              <p className="text-xs text-slate-500">{user.email}</p>
              <span className="inline-block mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-sky-100 text-sky-800">
                Level Akses: {role}
              </span>
            </div>
          </div>

          {loadError && (
            <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {loadError}
            </p>
          )}

          {message && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Konter / Usaha Servis HP</label>
              <input 
                type="text" 
                value={workshopName} 
                onChange={(e) => setWorkshopName(e.target.value)}
                placeholder="Contoh: R17 Cellservice"
                className="w-full rounded-lg border border-slate-300 p-3 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nomor WhatsApp / Kontak</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full rounded-lg border border-slate-300 p-3 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={saving || Boolean(loadError)}
                className="cursor-pointer rounded-lg bg-sky-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}