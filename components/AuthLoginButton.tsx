// components/AuthLoginButton.tsx
"use client";

import { useState, useEffect } from "react";
import { auth, googleProvider, database } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { ref, set, get, child } from "firebase/database";

export default function AuthLoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Simpan/perbarui profil user di Firebase Realtime Database saat login
      if (currentUser) {
        try {
          const userRef = ref(database, `users/${currentUser.uid}`);
          const snapshot = await get(userRef);

          if (!snapshot.exists()) {
            // Jika user baru pertama kali login, beri role default "free"
            await set(userRef, {
              uid: currentUser.uid,
              name: currentUser.displayName || "Teknisi",
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              role: "free", // Pilihan role: "free", "vip", "admin"
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            });
          } else {
            // Jika user lama, perbarui waktu login terakhir
            await set(ref(database, `users/${currentUser.uid}/lastLogin`), new Date().toISOString());
          }
        } catch (error) {
          console.error("Gagal menyinkronkan data user ke database:", error);
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
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  if (loading) {
    return <span className="text-xs text-sky-200">Memuat sesi...</span>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1 rounded-full border border-sky-400/30">
          {user.photoURL && (
            <img 
              src={user.photoURL} 
              alt="Avatar" 
              className="w-6 h-6 rounded-full border border-white" 
            />
          )}
          <span className="text-xs text-white font-medium max-w-[120px] truncate">
            {user.displayName || user.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer shadow"
        >
          Keluar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="bg-[#0099ff] hover:bg-[#007acc] text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer border border-sky-300/40"
    >
      🔑 Login Teknisi
    </button>
  );
}