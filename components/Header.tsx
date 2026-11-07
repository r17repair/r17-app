"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";

const navigation = [
  { label: "Beranda", href: "/" },
  { label: "Tutorial & Panduan", href: "/tutorials" },
  { label: "Troubleshooting & Solusi", href: "/tutorials#troubleshooting" },
  { label: "Firmware & Software", href: "/firmware" },
  { label: "Schematic & Layout", href: "/schematic" },
  { label: "Tips & Trik Teknisi", href: "/tutorials#tips" },
];

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [accountError, setAccountError] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          const response = await fetch("/api/account", {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (!response.ok) throw new Error("Gagal menyiapkan profil R17 Vault.");
          setAccountError("");
        } catch (error) {
          console.error("Gagal menyiapkan profil R17 Vault:", error);
          setAccountError("Profil belum tersinkron. Muat ulang halaman atau coba lagi.");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "https://r17repair.my.id";
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="R17 Repair Portal, Beranda">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sm font-black text-sky-700">
            R17
          </span>
          <span className="truncate text-sm font-extrabold tracking-wide text-slate-900 sm:text-base">
            R17 REPAIR PORTAL
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          {loading ? (
            <span className="text-xs text-slate-500">Memuat sesi...</span>
          ) : user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                {user.photoURL && (
                  <img src={user.photoURL} alt="" className="h-5 w-5 rounded-full" />
                )}
                <span className="hidden max-w-[130px] truncate sm:inline">
                  {user.displayName || "Akun Teknisi"}
                </span>
              </Link>
              <Link
                href="/tokens"
                className="hidden rounded-lg bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100 sm:inline-flex"
              >
                Token
              </Link>
              <Link
                href="/settings"
                className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 sm:inline-flex"
              >
                Setelan
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Keluar
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-700"
            >
              Login Teknisi
            </Link>
          )}
        </div>
      </div>

      {accountError && (
        <p role="alert" className="mx-auto max-w-7xl px-4 pb-2 text-xs text-rose-700 sm:px-6 lg:px-8">
          {accountError}
        </p>
      )}

      <nav aria-label="Navigasi utama" className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl justify-center gap-1 overflow-x-auto px-3 py-2 sm:px-6 lg:px-8">
          {navigation.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href.startsWith("/tutorials")
                  ? pathname === "/tutorials"
                  : pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-sky-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
