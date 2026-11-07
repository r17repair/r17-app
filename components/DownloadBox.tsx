"use client";

import { useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { apiRequest } from "@/lib/clientApi";

interface DownloadBoxProps {
  fileId: string;
  fileName: string;
  filePath: string;
  viewUrl?: string | null;
  description?: string | null;
  downloadCount?: number | null;
  tokenCost?: number;
  details?: string[];
}

interface DownloadResponse {
  downloadURL: string;
  tokensCharged: number;
  balance: number;
}

export default function DownloadBox({
  fileId,
  fileName,
  filePath,
  viewUrl,
  description,
  downloadCount = 0,
  tokenCost = 0,
  details = [],
}: DownloadBoxProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const categoryKey = filePath.split("/")[0] ?? "firmware";
  const breadcrumbCategory =
    categoryKey === "schematic" || categoryKey === "schematics"
      ? "Schematic & Layout"
      : categoryKey === "tools"
        ? "Tools & Drivers"
        : "Firmware & Software";
  const breadcrumbHref =
    categoryKey === "schematic" || categoryKey === "schematics"
      ? "/schematic"
      : categoryKey === "tools"
        ? "/tools"
        : "/firmware";

  const handleDownload = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await apiRequest<DownloadResponse>("/api/downloads", {
        method: "POST",
        body: JSON.stringify({
          category: categoryKey,
          fileId,
          operationId: crypto.randomUUID(),
        }),
      });
      setMessage(
        result.tokensCharged > 0
          ? `${result.tokensCharged} token digunakan. Saldo tersisa ${result.balance}.`
          : "Unduhan berhasil disiapkan.",
      );
      window.location.assign(result.downloadURL);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unduhan gagal diproses.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="my-2 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-sky-500">
      <Breadcrumb category={breadcrumbCategory} categoryHref={breadcrumbHref} title={fileName} />
      <h3 className="mb-2 text-base font-bold text-slate-900">{fileName}</h3>
      <p className="mb-4 text-xs leading-5 text-slate-600">
        {description && <span className="mb-2 block">{description}</span>}
        {details.length > 0 && `${details.join(" | ")}. `}
        Diunduh {downloadCount} kali ·{" "}
        <strong className="text-sky-700">
          {tokenCost > 0 ? `${tokenCost} token` : "Gratis"}
        </strong>
      </p>
      <p className="mb-3 text-[11px] leading-5 text-slate-500">
        Pembelian token dicatat untuk unduhan melalui portal. Tautan pada penyimpanan publik tetap dapat dibagikan.
      </p>
      <div className="flex flex-wrap gap-3">
        {viewUrl && (
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-5 py-2.5 text-xs font-bold text-sky-700 transition hover:border-sky-500 hover:bg-sky-50"
          >
            Lihat detail
          </a>
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-sky-700 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Menyiapkan unduhan..." : tokenCost > 0 ? "Unduh dengan Token" : "Unduh Berkas"}
        </button>
      </div>
      {message && (
        <p role="status" className="mt-3 text-xs text-slate-600">
          {message}
        </p>
      )}
      {message.toLocaleLowerCase("id").includes("token tidak mencukupi") && (
        <Link href="/tokens" className="mt-2 inline-flex text-xs font-bold text-sky-700 hover:text-sky-800">
          Top-up token
        </Link>
      )}
      {message.toLocaleLowerCase("id").includes("silakan masuk") && (
        <Link href="/login" className="mt-2 inline-flex text-xs font-bold text-sky-700 hover:text-sky-800">
          Masuk untuk mengunduh
        </Link>
      )}
    </article>
  );
}
