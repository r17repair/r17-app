// components/DownloadBox.tsx
"use client";

import { useState, useEffect } from "react";
import { database } from "@/lib/firebase";
import { onValue, ref, runTransaction } from "firebase/database";
import { getSafeDirectDownloadURL, getSafeDownloadURL } from "@/lib/fileCatalog";
import Breadcrumb from "@/components/Breadcrumb";

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
  const categoryKey = filePath?.split("/")[0] ?? "firmware";
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
    <article className="my-2 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-sky-500">
      <Breadcrumb category={breadcrumbCategory} categoryHref={breadcrumbHref} title={fileName} />
      <h3 className="mb-2 text-base font-bold text-slate-900">{fileName}</h3>
      <p className="mb-4 text-xs leading-5 text-slate-600">
        {description && <span className="block mb-2">{description}</span>}
        {details.length > 0 && `${details.join(" | ")}. `}
        Total diunduh oleh teknisi:{" "}
        <strong className="text-sky-700">
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
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-sky-700"
          >
            Unduh Berkas
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
            className="rounded-lg border border-sky-200 bg-sky-50 px-5 py-2.5 text-xs font-bold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
          >
            Lihat Berkas
          </a>
        )}
      </div>
    </article>
  );
}