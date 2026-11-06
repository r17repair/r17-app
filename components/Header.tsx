// components/Header.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, googleProvider, database } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { ref, set, get } from "firebase/database";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        try {
          const userRef = ref(database, `users/${currentUser.uid}`);
          const snapshot = await get(userRef);

          if (!snapshot.exists()) {
            await set(userRef, {
              uid: currentUser.uid,
              name: currentUser.displayName || "Teknisi",
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              role: "free",
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            });
          } else {
            await set(ref(database, `users/${currentUser.uid}/lastLogin`), new Date().toISOString());
          }
        } catch (error) {
          console.error("Gagal menyinkronkan data user:", error);
        }
      }
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Mengarahkan kembali ke landing page Blogspot setelah logout
      window.location.href = "https://r17repair.my.id";
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="bg-[#002b66] text-white text-[11px] px-6 py-1.5 flex justify-between items-center">
        <div className="flex gap-6 font-medium tracking-wide">
          <Link href="#subscribe" className="hover:text-sky-300 transition">Subscribe</Link>
          <Link href="#help" className="hover:text-sky-300 transition">Help</Link>
          <Link href="#join" className="hover:text-sky-300 transition">Join</Link>
          <Link href="#community" className="hover:text-sky-300 transition">Community</Link>
        </div>
        <div className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
          • VERCEL NODE ACTIVE
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-[#0066cc] text-white font-extrabold w-9 h-9 rounded-lg flex items-center justify-center text-sm shadow-md border border-sky-400">
            R17
          </div>
          <span className="font-extrabold text-[#002b66] text-base tracking-wide">
            R17 REPAIR PORTAL
          </span>
        </div>

        <div>
          {loading ? (
            <span className="text-xs text-slate-400">Memuat sesi...</span>
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link 
                href="/profile" 
                className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-200 transition"
              >
                {user.photoURL && (
                  <img src={user.photoURL} alt="Avatar" className="w-5 h-5 rounded-full border border-sky-500" />
                )}
                <span className="text-xs text-slate-800 font-semibold max-w-[110px] truncate">
                  {user.displayName}
                </span>
              </Link>
              <Link 
                href="/settings"
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow"
              >
                ⚙️ Setelan
              </Link>
              <button
                onClick={handleLogout}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow cursor-pointer"
              >
                Keluar
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-[#0099ff] hover:bg-[#007acc] text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer border border-sky-300/40"
            >
              🔑 Login Teknisi
            </button>
          )}
        </div>
      </div>

      <nav className="bg-[#0066cc] text-white text-xs font-bold px-6 py-2.5 flex gap-6 overflow-x-auto shadow-inner">
        <Link href="/" className="hover:text-sky-200 transition uppercase">Home Portal</Link>
        <Link href="/firmware" className="hover:text-sky-200 transition uppercase">Firmware Center</Link>
        <Link href="/schematic" className="hover:text-sky-200 transition uppercase">Schematic Center</Link>
        <Link href="/tools" className="hover:text-sky-200 transition uppercase">PC Tools &amp; Drivers</Link>
        <Link href="/tutorials" className="hover:text-sky-200 transition uppercase">Tutorials</Link>
      </nav>
    </header>
  );
}