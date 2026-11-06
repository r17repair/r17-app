// components/DownloadBox.tsx
"use client";

import { useState, useEffect } from "react";
import { database } from "@/lib/firebase";
import { onValue, ref, runTransaction } from "firebase/database";
import { getSafeDirectDownloadURL, getSafeDownloadURL } from "@/lib/fileCatalog";

interface DownloadBoxProps {
  fileId: string;
  fileName: string;
  downloadURL?: string | null;
  filePath?: string;
  viewURL?: string | null;
  description?: string | null;
  downloadCount?: number | null;
  details?: string[];
}

export default function DownloadBox({
  fileId,
  fileName,
  downloadURL: initialDownloadURL,
  filePath,
  viewURL,
  description,
  downloadCount: initialDownloadCount,
  details = [],
}: DownloadBoxProps) {
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [countOverride, setCountOverride] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(
    initialDownloadCount === undefined || initialDownloadCount === null,
  );
  const [countError, setCountError] = useState(false);
  const [databaseDownloadURL, setDatabaseDownloadURL] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(
    initialDownloadURL === undefined && Boolean(filePath),
  );
  const [urlError, setUrlError] = useState(false);
  const downloadURL =
    initialDownloadURL === undefined
      ? databaseDownloadURL
      : getSafeDirectDownloadURL(initialDownloadURL);
  const safeViewURL = getSafeDirectDownloadURL(viewURL);
  const visibleDownloadCount = countOverride ?? initialDownloadCount ?? downloadCount;

  useEffect(() => {
    if (initialDownloadCount !== undefined && initialDownloadCount !== null) {
      return;
    }

    const countRef = ref(database, `downloads/${fileId}`);
    const unsubscribeCount = onValue(
      countRef,
      (snapshot) => {
        const value: unknown = snapshot.val();
        setDownloadCount(typeof value === "number" ? value : 0);
        setCountLoading(false);
        setCountError(false);
      },
      (error) => {
        console.error(`Gagal memuat counter unduhan "${fileId}":`, error);
        setCountLoading(false);
        setCountError(true);
      },
    );

    return unsubscribeCount;
  }, [fileId, initialDownloadCount]);

  useEffect(() => {
    if (initialDownloadURL !== undefined || !filePath) return;

    const unsubscribe = onValue(
      ref(database, filePath),
      (snapshot) => {
        setDatabaseDownloadURL(getSafeDownloadURL(snapshot.val()));
        setUrlLoading(false);
        setUrlError(false);
      },
      (error) => {
        console.error(`Gagal memuat URL unduhan "${filePath}":`, error);
        setDatabaseDownloadURL(null);
        setUrlError(true);
        setUrlLoading(false);
      },
    );

    return unsubscribe;
  }, [filePath, initialDownloadURL]);

  const handleDownload = () => {
    const usesCatalogCount =
      initialDownloadCount !== undefined &&
      initialDownloadCount !== null &&
      Boolean(filePath);
    const countRef = ref(
      database,
      usesCatalogCount ? `${filePath}/downloadCount` : `downloads/${fileId}`,
    );
    runTransaction(countRef, (currentValue) =>
      typeof currentValue === "number" ? currentValue + 1 : 1,
    )
      .then(({ snapshot }) => {
        if (usesCatalogCount) {
          setCountOverride(
            typeof snapshot.val() === "number" ? snapshot.val() : 0,
          );
        }
      })
      .catch((error) => {
        console.error(`Gagal memperbarui counter unduhan "${fileId}":`, error);
        setCountError(true);
      });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm my-4">
      <h3 className="font-bold text-[#002b66] text-base mb-2">📦 {fileName}</h3>
      <p className="text-xs text-slate-600 mb-4">
        {description && <span className="block mb-2">{description}</span>}
        {details.length > 0 && `${details.join(" | ")}. `}
        Total diunduh oleh teknisi:{" "}
        <strong className="text-[#0099ff]">
          {countLoading ? "..." : countError ? "tidak tersedia" : `${visibleDownloadCount}x`}
        </strong>
      </p>

      <div className="flex flex-wrap gap-3">
        {downloadURL ? (
          <a
            href={downloadURL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDownload}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md inline-flex items-center gap-2"
          >
            📥 Unduh Berkas
          </a>
        ) : (
          <p className="text-xs text-slate-500" role={urlError ? "alert" : undefined}>
            {urlLoading
              ? "Memuat tautan unduhan..."
              : urlError
                ? "Tautan unduhan gagal dimuat."
                : "Tautan unduhan belum tersedia atau tidak valid."}
          </p>
        )}
        {safeViewURL && (
          <a
            href={safeViewURL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-sky-700"
          >
            👁️ Lihat Berkas
          </a>
        )}
      </div>
    </div>
  );
}