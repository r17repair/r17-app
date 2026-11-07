"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/clientApi";

interface Donation {
  id: string;
  tokens: number;
  amount: number;
  status: string;
  expiresAt: number;
  reference?: string | null;
}

interface PaymentIntent {
  transaction: Donation & { uniqueCode: number };
  payment: {
    merchantName: string;
    qrisImageUrl: string;
    minimumDonationAmount: number;
    rupiahPerToken: number;
  };
}

function rupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function TokensPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [donationAmount, setDonationAmount] = useState("10000");
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [transactions, setTransactions] = useState<Donation[]>([]);
  const [minimumDonationAmount, setMinimumDonationAmount] = useState(10000);
  const [rupiahPerToken, setRupiahPerToken] = useState(1000);
  const [maxTopUpTokens, setMaxTopUpTokens] = useState(10000);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = async () => {
    const result = await apiRequest<{ transactions: Donation[] }>("/api/payments");
    setTransactions(result.transactions);
  };

  useEffect(() => {
    let active = true;
    void fetch("/api/settings")
      .then(async (response) => {
        if (!response.ok) throw new Error("Gagal memuat pengaturan top-up.");
        const result = (await response.json()) as {
          settings?: {
            minimumDonationAmount?: number;
            rupiahPerToken?: number;
            maxTopUpTokens?: number;
          };
        };
        if (active) {
          if (typeof result.settings?.minimumDonationAmount === "number") {
            setMinimumDonationAmount(result.settings.minimumDonationAmount);
          }
          if (typeof result.settings?.rupiahPerToken === "number") {
            setRupiahPerToken(result.settings.rupiahPerToken);
          }
          if (typeof result.settings?.maxTopUpTokens === "number") {
            setMaxTopUpTokens(result.settings.maxTopUpTokens);
          }
        }
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat pengaturan top-up:", error);
        if (active) setMessage(error instanceof Error ? error.message : "Pengaturan top-up gagal dimuat.");
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSignedIn(Boolean(user));
      if (user) {
        void refresh().catch((error: unknown) => {
          console.error("Gagal memuat riwayat top-up:", error);
          setMessage(error instanceof Error ? error.message : "Riwayat transaksi gagal dimuat.");
        });
      } else {
        setTransactions([]);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const createIntent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await apiRequest<PaymentIntent>("/api/payments", {
        method: "POST",
        body: JSON.stringify({ amountIdr: Number(donationAmount) }),
      });
      setIntent(result);
      setMinimumDonationAmount(result.payment.minimumDonationAmount);
      setRupiahPerToken(result.payment.rupiahPerToken);
      setReference("");
      setProofUrl("");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pembayaran gagal dibuat.");
    } finally {
      setBusy(false);
    }
  };

  const submitReference = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!intent) return;
    setBusy(true);
    setMessage("");
    try {
      await apiRequest(`/api/payments/${intent.transaction.id}`, {
        method: "PATCH",
        body: JSON.stringify({ reference, proofUrl }),
      });
      setMessage("Referensi pembayaran terkirim. Token akan masuk setelah admin memverifikasi.");
      setIntent(null);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Referensi pembayaran gagal dikirim.");
    } finally {
      setBusy(false);
    }
  };

  if (!signedIn) {
    return (
      <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">Top-up token</h1>
          <p className="mt-2 text-sm text-slate-600">Masuk untuk membeli dan mengelola token Vault.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-bold text-white">
            Masuk ke akun
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Saldo Vault</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Top-up token</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pembayaran QRIS DANA Bisnis diproses manual. Token hanya ditambahkan setelah pembayaran diverifikasi admin.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <section className="h-fit rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Buat permintaan top-up</h2>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Kurs {rupiah(rupiahPerToken)} per token. Minimal top-up {rupiah(minimumDonationAmount)}.
            Nominal unik ditambahkan untuk membantu pencocokan; transfer persis seperti yang tertera.
          </p>
          <form onSubmit={createIntent} className="mt-5 space-y-3">
            <label htmlFor="donation-amount" className="block text-xs font-semibold text-slate-700">
              Nominal transfer (Rupiah)
            </label>
            <input
              id="donation-amount"
              type="number"
              min={Math.ceil(minimumDonationAmount / rupiahPerToken) * rupiahPerToken}
              max={maxTopUpTokens * rupiahPerToken}
              step={rupiahPerToken}
              required
              value={donationAmount}
              onChange={(event) => setDonationAmount(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
            <p className="text-xs text-slate-500">
              Anda menerima {Math.floor(Number(donationAmount) / rupiahPerToken) || 0} token. Nominal unik ditambahkan saat membuat permintaan.
            </p>
            <button disabled={busy} className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-60">
              {busy ? "Memproses..." : "Buat pembayaran QRIS"}
            </button>
          </form>

          {intent && (
            <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs font-semibold text-slate-700">{intent.payment.merchantName}</p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">{rupiah(intent.transaction.amount)}</p>
              {intent.payment.qrisImageUrl ? (
                <img
                  src={intent.payment.qrisImageUrl}
                  alt="QRIS DANA Bisnis"
                  className="mx-auto mt-3 max-h-64 rounded-lg border border-slate-200 bg-white object-contain p-2"
                />
              ) : (
                <p className="mt-3 rounded-lg bg-white p-3 text-xs text-amber-800">
                  Gambar QRIS belum dikonfigurasi. Admin perlu memasang tautan gambar QRIS di pengaturan.
                </p>
              )}
              <p className="mt-3 text-xs leading-5 text-slate-600">
                Transfer dengan nominal tepat sebelum {new Date(intent.transaction.expiresAt).toLocaleTimeString("id-ID")}.
                Setelah membayar, isi referensi transaksi di bawah.
              </p>
              <form onSubmit={submitReference} className="mt-4 space-y-2">
                <input
                  required
                  minLength={4}
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Nomor referensi transaksi"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                />
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(event) => setProofUrl(event.target.value)}
                  placeholder="URL bukti pembayaran (opsional)"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                />
                <button disabled={busy} className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-60">
                  Kirim untuk verifikasi
                </button>
              </form>
            </div>
          )}
          {message && <p role="status" className="mt-4 text-xs text-slate-600">{message}</p>}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Riwayat pembayaran</h2>
          <div className="mt-4 space-y-3">
            {transactions.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada transaksi top-up.</p>
            ) : transactions.map((transaction) => (
              <article key={transaction.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{transaction.tokens} token</p>
                    <p className="mt-1 text-xs text-slate-500">{rupiah(transaction.amount)}</p>
                  </div>
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700">
                    {transaction.status}
                  </span>
                </div>
                <p className="mt-2 break-all text-[10px] text-slate-400">ID: {transaction.id}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
