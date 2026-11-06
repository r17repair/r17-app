// app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { auth, database } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { ref, onValue, update } from "firebase/database";
import Link from "next/link";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [workshopName, setWorkshopName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [role, setRole] = useState<string>("free");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = ref(database, `users/${currentUser.uid}`);
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setWorkshopName(data.workshopName || "");
            setPhone(data.phone || "");
            setRole(data.role || "free");
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      const userRef = ref(database, `users/${user.uid}`);
      await update(userRef, {
        workshopName: workshopName,
        phone: phone,
        updatedAt: new Date().toISOString(),
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-bold text-slate-600">Memuat pengaturan akun...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-sm text-slate-600 font-medium">Silakan login terlebih dahulu untuk mengakses halaman ini.</p>
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
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-extrabold uppercase tracking-wide">⚙️ Pengaturan Akun Teknisi</h1>
          <Link href="/" className="bg-[#0066cc] hover:bg-[#0055aa] text-white text-xs font-bold px-4 py-2 rounded-lg transition">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>

      {/* Form Pengaturan */}
      <div className="max-w-3xl mx-auto px-6 py-8">
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
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nomor WhatsApp / Kontak</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-[#0066cc] hover:bg-[#0055aa] text-white text-xs font-bold px-5 py-2.5 rounded-lg transition shadow cursor-pointer disabled:opacity-50"
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