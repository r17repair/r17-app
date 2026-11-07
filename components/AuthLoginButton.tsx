// components/AuthLoginButton.tsx
"use client";

import { useState, useEffect } from "react";
import { auth, googleProvider, database } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { ref, set, get } from "firebase/database";

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
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
          {user.photoURL && (
            <img 
              src={user.photoURL} 
              alt="Avatar" 
              className="h-6 w-6 rounded-full border border-sky-200"
            />
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
    <button
      onClick={handleLogin}
      className="flex cursor-pointer items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-700"
    >
      Login Teknisi
    </button>
  );
}