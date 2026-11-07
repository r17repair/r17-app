"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/clientApi";

interface QueueItem {
  id: string;
  [key: string]: unknown;
}

interface QueueResponse {
  donations: QueueItem[];
  applications: QueueItem[];
  submissions: QueueItem[];
  settings: Partial<Settings>;
}

interface Settings {
  siteName: string;
  siteTagline: string;
  rupiahPerToken: number;
  minimumDonationAmount: number;
  maintenanceMode: boolean;
  contributorRewardTokens: number;
  qrisImageUrl: string;
  qrisMerchantName: string;
  maxTopUpTokens: number;
  baseUrls: {
    schematic: string;
    firmware: string;
    tools: string;
    tutorials: string;
  };
}

const initialSettings: Settings = {
  siteName: "R17 Repair Vault",
  siteTagline: "Pusat Direktori & Repositori Berkas Perbaikan Ponsel Terverifikasi",
  rupiahPerToken: 1000,
  minimumDonationAmount: 10000,
  maintenanceMode: false,
  contributorRewardTokens: 1,
  qrisImageUrl: "",
  qrisMerchantName: "DANA Bisnis R17 Repair",
  maxTopUpTokens: 10000,
  baseUrls: {
    schematic: "https://schematic.r17repair.my.id",
    firmware: "https://firmware.r17repair.my.id",
    tools: "https://tools.r17repair.my.id",
    tutorials: "https://tutorials.r17repair.my.id",
  },
};

export default function AdminPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [queue, setQueue] = useState<QueueResponse | null>(null);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const result = await apiRequest<QueueResponse>("/api/admin/queue");
    setQueue(result);
    setSettings({ ...initialSettings, ...result.settings });
  }, []);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setSignedIn(Boolean(user));
    if (user) {
      void refresh().catch((error: unknown) => {
        console.error("Gagal memuat admin queue:", error);
        setMessage(error instanceof Error ? error.message : "Akses admin gagal dimuat.");
      });
    } else {
      setQueue(null);
    }
  }), [refresh]);

  const mutate = async (key: string, url: string, body: object) => {
    setBusy(key);
    setMessage("");
    try {
      await apiRequest(url, { method: "PATCH", body: JSON.stringify(body) });
      setMessage("Perubahan berhasil disimpan.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Permintaan admin gagal.");
    } finally {
      setBusy("");
    }
  };

  const saveSettings = async () => {
    setBusy("settings");
    setMessage("");
    try {
      await apiRequest("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      setMessage("Pengaturan situs tersimpan.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pengaturan gagal disimpan.");
    } finally {
      setBusy("");
    }
  };

  if (!signedIn) {
    return (
      <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">Panel Admin</h1>
          <p className="mt-2 text-sm text-slate-600">Masuk dengan akun administrator.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-bold text-white">
            Masuk
          </Link>
        </div>
      </main>
    );
  }

  const textField = (
    label: string,
    value: string | number,
    update: (value: string) => void,
    type: "text" | "number" | "url" = "text",
  ) => (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => update(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </label>
  );

  return (
    <main className="flex-1 bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">R17 Vault</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Administrasi</h1>
          <p className="mt-2 text-sm text-slate-600">Moderasi transaksi, kontributor, metadata file, dan konfigurasi situs.</p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {message && <p role="status" className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">{message}</p>}

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Pengaturan global</h2>
          <p className="mt-1 text-xs text-slate-500">Jangan masukkan kredensial atau API key rahasia di sini.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {textField("Nama situs", settings.siteName, (siteName) => setSettings({ ...settings, siteName }))}
            {textField("Tagline", settings.siteTagline, (siteTagline) => setSettings({ ...settings, siteTagline }))}
            {textField("Subdomain schematic", settings.baseUrls.schematic, (schematic) => setSettings({
              ...settings,
              baseUrls: { ...settings.baseUrls, schematic },
            }), "url")}
            {textField("Subdomain firmware", settings.baseUrls.firmware, (firmware) => setSettings({
              ...settings,
              baseUrls: { ...settings.baseUrls, firmware },
            }), "url")}
            {textField("Subdomain tools", settings.baseUrls.tools, (tools) => setSettings({
              ...settings,
              baseUrls: { ...settings.baseUrls, tools },
            }), "url")}
            {textField("Subdomain tutorials", settings.baseUrls.tutorials, (tutorials) => setSettings({
              ...settings,
              baseUrls: { ...settings.baseUrls, tutorials },
            }), "url")}
            {textField("Rupiah per token", settings.rupiahPerToken, (value) => setSettings({ ...settings, rupiahPerToken: Number(value) }), "number")}
            {textField("Minimal donasi (Rupiah)", settings.minimumDonationAmount, (value) => setSettings({ ...settings, minimumDonationAmount: Number(value) }), "number")}
            {textField("Reward kontributor per unduhan berbayar", settings.contributorRewardTokens, (value) => setSettings({ ...settings, contributorRewardTokens: Number(value) }), "number")}
            {textField("Batas top-up (token)", settings.maxTopUpTokens, (value) => setSettings({ ...settings, maxTopUpTokens: Number(value) }), "number")}
            {textField("Nama merchant QRIS", settings.qrisMerchantName, (qrisMerchantName) => setSettings({ ...settings, qrisMerchantName }))}
            {textField("URL gambar QRIS (HTTPS)", settings.qrisImageUrl, (qrisImageUrl) => setSettings({ ...settings, qrisImageUrl }), "url")}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(event) => setSettings({ ...settings, maintenanceMode: event.target.checked })}
                className="h-4 w-4 accent-sky-600"
              />
              Mode maintenance
            </label>
          </div>
          <button onClick={saveSettings} disabled={Boolean(busy)} className="mt-4 rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-60">
            {busy === "settings" ? "Menyimpan..." : "Simpan pengaturan"}
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Verifikasi top-up</h2>
          <QueueList
            items={queue?.donations ?? []}
            empty="Tidak ada pembayaran yang menunggu verifikasi."
            render={(item) => (
              <>
                <p className="font-semibold text-slate-800">{String(item.tokens)} token · Rp{String(item.amount)}</p>
                <p className="mt-1 break-all text-xs text-slate-600">UID: {String(item.uid)} · Referensi: {String(item.reference ?? "belum diberikan")}</p>
                {typeof item.proofUrl === "string" && (
                  <a href={item.proofUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-sky-700">Buka bukti pembayaran</a>
                )}
                <div className="mt-3 flex gap-2">
                  <button disabled={Boolean(busy)} onClick={() => mutate(String(item.id), `/api/admin/payments/${item.id}`, { action: "approve" })} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">Verifikasi &amp; beri token</button>
                  {item.status !== "processing_approval" && (
                    <button disabled={Boolean(busy)} onClick={() => mutate(String(item.id), `/api/admin/payments/${item.id}`, { action: "reject" })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60">Tolak</button>
                  )}
                </div>
              </>
            )}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Pengajuan kontributor</h2>
          <QueueList
            items={queue?.applications ?? []}
            empty="Tidak ada pengajuan kontributor."
            render={(item) => (
              <>
                <p className="font-semibold text-slate-800">{String(item.name)} · {String(item.email)}</p>
                <p className="mt-1 text-xs text-slate-600">{String(item.specialties ?? "")}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{String(item.reason)}</p>
                <div className="mt-3 flex gap-2">
                  <button disabled={Boolean(busy)} onClick={() => mutate(String(item.uid), `/api/admin/contributors/${item.uid}`, { action: "approve" })} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">Setujui</button>
                  <button disabled={Boolean(busy)} onClick={() => mutate(String(item.uid), `/api/admin/contributors/${item.uid}`, { action: "reject" })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60">Tolak</button>
                </div>
              </>
            )}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Moderasi metadata berkas</h2>
          <QueueList
            items={queue?.submissions ?? []}
            empty="Tidak ada metadata berkas menunggu moderasi."
            render={(item) => (
              <FileModerationItem
                item={item}
                disabled={Boolean(busy)}
                onSubmit={(tokenCost) => mutate(String(item.id), `/api/admin/files/${item.id}`, { action: "approve", tokenCost })}
                onReject={() => mutate(String(item.id), `/api/admin/files/${item.id}`, { action: "reject" })}
              />
            )}
          />
        </section>
      </div>
    </main>
  );
}

function QueueList({
  items,
  empty,
  render,
}: {
  items: QueueItem[];
  empty: string;
  render: (item: QueueItem) => React.ReactNode;
}) {
  if (items.length === 0) return <p className="mt-3 text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="mt-3 divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.id} className="py-4">{render(item)}</li>
      ))}
    </ul>
  );
}

function FileModerationItem({
  item,
  disabled,
  onSubmit,
  onReject,
}: {
  item: QueueItem;
  disabled: boolean;
  onSubmit: (tokenCost: number) => void;
  onReject: () => void;
}) {
  const [tokenCost, setTokenCost] = useState("1");
  return (
    <>
      <p className="font-semibold text-slate-800">{String(item.title)} · {String(item.category)}</p>
      <p className="mt-1 text-xs text-slate-600">{String(item.description ?? "")}</p>
      <a
        href={String(item.download_url ?? item.github_file_path ?? "")}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block break-all text-xs text-sky-700"
      >
        {String(item.download_url ?? item.github_file_path ?? "URL tidak tersedia")}
      </a>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-xs text-slate-600">
          Biaya token
          <input type="number" min="0" max="100000" value={tokenCost} onChange={(event) => setTokenCost(event.target.value)} className="ml-2 w-20 rounded border border-slate-300 px-2 py-1" />
        </label>
        <button disabled={disabled} onClick={() => onSubmit(Number(tokenCost))} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">Setujui &amp; terbitkan</button>
        <button disabled={disabled} onClick={onReject} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60">Tolak</button>
      </div>
    </>
  );
}
