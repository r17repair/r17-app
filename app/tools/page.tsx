// app/tools/page.tsx
"use client";

import Link from "next/link";

export default function ToolsPage() {
  const toolsList = [
    { id: 1, title: "SP Flash Tool (Smartphone Flash Utility)", category: "MediaTek Flasher", version: "v5.2228", size: "65 MB", link: "#" },
    { id: 2, title: "Qualcomm Product Support Tool (QPST)", category: "Qualcomm Flasher", version: "v2.7.496", size: "45.2 MB", link: "#" },
    { id: 3, title: "Odin3 Samsung Flasher Tool", category: "Samsung Utility", version: "v3.14.4", size: "3.5 MB", link: "#" },
    { id: 4, title: "Universal ADB & Fastboot Drivers Installer", category: "Drivers", version: "v1.4.3", size: "9.2 MB", link: "#" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Sederhana */}
      <div className="bg-[#002b66] text-white py-6 px-8 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-wide">🛠️ PC Tools &amp; Drivers Repository</h1>
            <p className="text-xs text-sky-200 mt-1">Koleksi software flashing, tool repair, dan driver komputer esensial untuk teknisi.</p>
          </div>
          <Link href="/" className="bg-[#0066cc] hover:bg-[#0055aa] text-white text-xs font-bold px-4 py-2 rounded-lg transition">
            ← Kembali ke Home
          </Link>
        </div>
      </div>

      {/* Daftar Tools */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-4">
          {toolsList.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{item.category}</span>
                <h3 className="font-bold text-[#002b66] text-base mt-1">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Versi: <span className="font-semibold text-slate-700">{item.version}</span> | Ukuran: <span className="font-semibold text-slate-700">{item.size}</span></p>
              </div>
              <a 
                href={item.link} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow flex items-center gap-2"
              >
                📥 Unduh Tool
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}