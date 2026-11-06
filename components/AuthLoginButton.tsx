// components/AuthLoginButton.tsx
"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";

export default function AuthLoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Gagal melakukan login:", error);
      alert("Login gagal. Pastikan pop-up diizinkan di browser Anda.");
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
    return <div className="text-xs text-slate-500">Memuat sesi...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200">
        {user.photoURL ? (
          <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-full border border-emerald-500" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#002b66] text-white flex items-center justify-center text-xs font-bold">
            {user.displayName?.[0] || "U"}
          </div>
        )}
        <div className="text-left hidden md:block">
          <span className="block text-xs font-bold text-[#002b66] leading-tight">{user.displayName || "Teknisi"}</span>
          <span className="block text-[10px] text-emerald-600 font-semibold">● Active Session</span>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded transition-colors ml-2"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin}
      className="bg-[#0099ff] hover:bg-[#0077cc] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
    >
      🔑 Login Teknisi
    </button>
  );
}