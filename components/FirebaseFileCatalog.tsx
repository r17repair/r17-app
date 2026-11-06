"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/lib/firebase";
import { getSafeDirectDownloadURL, getSafeDownloadURL } from "@/lib/fileCatalog";
import DownloadBox from "@/components/DownloadBox";

interface FirebaseFile {
  id: string;
  title: string;
  downloadURL: string | null;
  viewURL: string | null;
  description: string | null;
  downloadCount: number | null;
  details: string[];
}

interface FirebaseFileCatalogProps {
  path: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function displayValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}

function toFirebaseFiles(value: unknown): FirebaseFile[] | null {
  if (!Array.isArray(value) && !isRecord(value)) return null;

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value);

  return entries.flatMap(([id, rawItem]) => {
    if (!isRecord(rawItem)) return [];

    const title =
      displayValue(rawItem.title) ??
      displayValue(rawItem.name) ??
      displayValue(rawItem.fileName) ??
      displayValue(rawItem.label) ??
      id;
    const downloadURL = getSafeDownloadURL(rawItem);
    const viewURL = getSafeDirectDownloadURL(rawItem.urlView);
    const description = displayValue(rawItem.description);
    const downloadCount =
      typeof rawItem.downloadCount === "number" ? rawItem.downloadCount : null;
    const details = [
      displayValue(rawItem.category) ?? displayValue(rawItem.type),
      displayValue(rawItem.version),
      displayValue(rawItem.size) ?? displayValue(rawItem.fileSize),
    ].filter((detail): detail is string => detail !== null);

    return [{ id, title, downloadURL, viewURL, description, downloadCount, details }];
  });
}

export default function FirebaseFileCatalog({ path }: FirebaseFileCatalogProps) {
  const [files, setFiles] = useState<FirebaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onValue(
      ref(database, path),
      (snapshot) => {
        if (!snapshot.exists()) {
          setFiles([]);
          setError(null);
        } else {
          const catalog = toFirebaseFiles(snapshot.val());
          if (catalog === null) {
            setFiles([]);
            setError("Format direktori Firebase tidak valid.");
          } else {
            setFiles(catalog);
            setError(null);
          }
        }
        setLoading(false);
      },
      (cause) => {
        console.error(`Gagal memuat direktori Firebase "${path}":`, cause);
        setFiles([]);
        setError("Direktori tidak dapat dimuat. Periksa koneksi dan izin Firebase.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [path]);

  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-500">Memuat direktori...</p>;
  }

  if (error) {
    return (
      <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
      </p>
    );
  }

  if (files.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">Belum ada berkas di direktori ini.</p>;
  }

  return (
    <div className="grid gap-4">
      {files.map((file) => (
        <DownloadBox
          key={file.id}
          fileId={file.id}
          fileName={file.title}
          downloadURL={file.downloadURL}
          filePath={`${path}/${file.id}`}
          viewURL={file.viewURL}
          description={file.description}
          downloadCount={file.downloadCount}
          details={file.details}
        />
      ))}
    </div>
  );
}
