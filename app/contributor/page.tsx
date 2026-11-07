"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/clientApi";

interface ContributorData {
  profile: { role: string; contributorStatus?: string };
  contributorApplication?: { status: string };
  fileSubmissions: Array<{ id: string; title: string; status: string; category: string }>;
}

export default function ContributorPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [account, setAccount] = useState<ContributorData | null>(null);
  const [reason, setReason] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [category, setCategory] = useState("firmware");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = async () => {
    const result = await apiRequest<ContributorData>("/api/account");
    setAccount(result);
  };

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setSignedIn(Boolean(user));
    if (user) {
      void refresh().catch((error: unknown) => {
        console.error("Gagal memuat status kontributor:", error);
        setMessage(error instanceof Error ? error.message : "Status akun gagal dimuat.");
      });
    } else {
      setAccount(null);
    }
  }), []);

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await apiRequest("/api/contributor/apply", {
        method: "POST",
        body: JSON.stringify({ reason, specialties }),
      });
      setMessage("Pengajuan terkirim dan menunggu persetujuan admin.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pengajuan gagal dikirim.");
    } finally {
      setBusy(false);
    }
  };

  const submitFile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await apiRequest("/api/contributor/files", {
        method: "POST",
        body: JSON.stringify({ title, description, githubUrl, category }),
      });
      setTitle("");
      setDescription("");
      setGithubUrl("");
      setMessage("Metadata file terkirim dan menunggu moderasi admin.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pengajuan file gagal dikirim.");
    } finally {
      setBusy(false);
    }
  };

  if (!signedIn) {
    return (
      <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">Program Kontributor</h1>
          <p className="mt-2 text-sm text-slate-600">Masuk untuk mengajukan akses kontributor.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-bold text-white">
            Masuk ke akun
          </Link>
        </div>
      </main>
    );
  }

  const approved =
    account?.profile.role === "contributor" || account?.profile.role === "admin";

  return (
    <main className="flex-1 bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Komunitas R17</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Program Kontributor</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Ajukan materi teknis untuk moderasi. Kontributor memperoleh token sesuai aturan reward yang ditetapkan admin pada unduhan berbayar yang memenuhi syarat.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {message && <p role="status" className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">{message}</p>}

        {!approved && (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">Ajukan menjadi kontributor</h2>
            <p className="mt-1 text-xs text-slate-600">
              Pengajuan ditinjau admin; pengiriman metadata file baru terbuka setelah disetujui.
            </p>
            <form onSubmit={submitApplication} className="mt-4 space-y-3">
              <input
                value={specialties}
                onChange={(event) => setSpecialties(event.target.value)}
                placeholder="Keahlian, mis. firmware Android atau boardview"
                maxLength={300}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
              <textarea
                required
                minLength={20}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Jelaskan pengalaman dan alasan ingin berkontribusi"
                rows={4}
                maxLength={1000}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
              <button disabled={busy} className="rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-60">
                Kirim pengajuan
              </button>
            </form>
            {account?.contributorApplication && (
              <p className="mt-3 text-xs text-slate-600">
                Status pengajuan: <strong>{account.contributorApplication.status}</strong>
              </p>
            )}
          </section>
        )}

        {approved && (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">Ajukan metadata berkas</h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Unggah berkas langsung ke GitHub sesuai kebijakan repository Anda, lalu kirim URL file GitHub di bawah. Token/API key GitHub tidak pernah diminta atau disimpan dari browser.
            </p>
            <form onSubmit={submitFile} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                required
                minLength={4}
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Judul berkas"
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                <option value="firmware">Firmware</option>
                <option value="schematics">Schematic &amp; Layout</option>
                <option value="tools">Tools &amp; Drivers</option>
              </select>
              <input
                required
                type="url"
                value={githubUrl}
                onChange={(event) => setGithubUrl(event.target.value)}
                placeholder="https://github.com/owner/repo/blob/main/file.zip"
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm sm:col-span-2"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1500}
                rows={3}
                placeholder="Deskripsi, versi, model perangkat"
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm sm:col-span-2"
              />
              <button disabled={busy} className="w-fit rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-60">
                Kirim untuk moderasi
              </button>
            </form>
          </section>
        )}

        {account && account.fileSubmissions.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">Pengajuan berkas saya</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {account.fileSubmissions.map((submission) => (
                <li key={submission.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="font-medium text-slate-800">{submission.title}</span>
                  <span className="text-xs text-slate-500">{submission.status}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
