"use client";

import { useEffect, useState } from "react";
import DownloadBox from "@/components/DownloadBox";

interface VaultFile {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  version: string | null;
  size: string | null;
  downloadCount: number;
  tokenCost: number;
  viewUrl: string | null;
  downloadUrl: string | null;
}

interface FirebaseFileCatalogProps {
  path: string;
}

export default function FirebaseFileCatalog({ path }: FirebaseFileCatalogProps) {
  const [result, setResult] = useState<{
    path: string;
    files: VaultFile[];
    error: string | null;
  }>({ path: "", files: [], error: null });

  useEffect(() => {
    const controller = new AbortController();
    const category = path.split("/")[0];

    const loadCatalog = async () => {
      try {
        const response = await fetch(
          `/api/vault/catalog?category=${encodeURIComponent(category)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const result = (await response.json()) as { files?: VaultFile[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Direktori tidak dapat dimuat.");
        if (!controller.signal.aborted) {
          setResult({ path, files: result.files ?? [], error: null });
        }
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        console.error(`Gagal memuat direktori "${path}":`, cause);
        if (!controller.signal.aborted) {
          setResult({
            path,
            files: [],
            error: cause instanceof Error ? cause.message : "Direktori tidak dapat dimuat.",
          });
        }
      }
    };
    void loadCatalog();

    return () => controller.abort();
  }, [path]);

  const loading = result.path !== path;
  const files = loading ? [] : result.files;
  const error = loading ? null : result.error;

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
          filePath={`${path}/${file.id}`}
          viewUrl={file.viewUrl}
          description={file.description}
          downloadCount={file.downloadCount}
          tokenCost={file.tokenCost}
          details={[file.category, file.version, file.size].filter(
            (detail): detail is string => Boolean(detail),
          )}
        />
      ))}
    </div>
  );
}
