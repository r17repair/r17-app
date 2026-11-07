"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/lib/firebase";
import { getSafeDirectDownloadURL } from "@/lib/fileCatalog";
import Breadcrumb from "@/components/Breadcrumb";

interface Tutorial {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  contentURL: string | null;
  memberOnly: boolean;
  viewCount: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function displayValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toTutorials(value: unknown): Tutorial[] | null {
  if (!Array.isArray(value) && !isRecord(value)) return null;

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value);

  return entries.flatMap(([id, rawItem]) => {
    if (!isRecord(rawItem)) return [];

    return [{
      id,
      title: displayValue(rawItem.title) ?? id,
      category: displayValue(rawItem.category),
      description: displayValue(rawItem.description),
      contentURL: getSafeDirectDownloadURL(rawItem.contentUrl),
      memberOnly: rawItem.isMemberOnly === true,
      viewCount: typeof rawItem.viewCount === "number" ? rawItem.viewCount : null,
    }];
  });
}

export default function FirebaseTutorialCatalog() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onValue(
      ref(database, "tutorials"),
      (snapshot) => {
        if (!snapshot.exists()) {
          setTutorials([]);
          setError(null);
        } else {
          const items = toTutorials(snapshot.val());
          if (items === null) {
            setTutorials([]);
            setError("Format direktori tutorial Firebase tidak valid.");
          } else {
            setTutorials(items);
            setError(null);
          }
        }
        setLoading(false);
      },
      (cause) => {
        console.error("Gagal memuat direktori tutorial:", cause);
        setTutorials([]);
        setError("Tutorial tidak dapat dimuat. Periksa koneksi dan izin Firebase.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-500">Memuat tutorial...</p>;
  }

  if (error) {
    return (
      <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
      </p>
    );
  }

  if (tutorials.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">Belum ada tutorial.</p>;
  }

  const troubleshootingIndex = tutorials.findIndex((tutorial) => {
    const category = tutorial.category?.toLocaleLowerCase("id") ?? "";
    return category.includes("troubleshoot") || category.includes("solusi");
  });
  const tipsIndex = tutorials.findIndex((tutorial) => {
    const category = tutorial.category?.toLocaleLowerCase("id") ?? "";
    return category.includes("tips") || category.includes("trik");
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tutorials.map((tutorial, index) => (
        <article
          key={tutorial.id}
          id={
            index === troubleshootingIndex
              ? "troubleshooting"
              : index === tipsIndex
                ? "tips"
                : undefined
          }
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-sky-500"
        >
          <Breadcrumb
            category="Tutorial & Panduan"
            categoryHref="/tutorials"
            title={tutorial.title}
          />
          <div className="flex flex-wrap items-center gap-2">
            {tutorial.category && (
              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700">
                {tutorial.category}
              </span>
            )}
            {tutorial.memberOnly && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                Khusus Member
              </span>
            )}
          </div>
          <h2 className="mt-2 text-base font-bold text-slate-900">{tutorial.title}</h2>
          {tutorial.description && (
            <p className="mt-2 text-sm text-slate-600">{tutorial.description}</p>
          )}
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              {tutorial.viewCount === null ? "" : `${tutorial.viewCount} kali dilihat`}
            </span>
            {tutorial.contentURL ? (
              <a
                href={tutorial.contentURL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-700"
              >
                Buka Tutorial
              </a>
            ) : (
              <span className="text-xs text-slate-500">Konten belum tersedia</span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
