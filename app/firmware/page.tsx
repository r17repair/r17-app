// app/firmware/page.tsx
"use client";

import Link from "next/link";

export default function FirmwarePage() {
  const firmwareList = [
    { id: 1, title: "Xiaomi Redmi Note 10 Pro Stock ROM", version: "MIUI 14.0.3.0 Global", size: "3.8 GB", link: "#" },
    { id: 2, title: "Oppo Reno 5 Official Firmware Flash File", version: "CPH2159_11_C.35", size: "4.2 GB", link: "#" },
    { id: 3, title: "Samsung Galaxy A52s 5G Combination & Stock ROM", version: "A528BXXS4HWF1", size: "5.1 GB", link: "#" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Sederhana */}
      <div className="bg-[#002b66] text-white py-6 px-8 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-wide">📦 Firmware Center Repository</h1>
            <p className="text-xs text-sky-200 mt-1">Pusat unduhan berkas flash ROM resmi dan terverifikasi untuk teknisi.</p>
          </div>
          <Link href="/" className="bg-[#0066cc] hover:bg-[#0055aa] text-white text-xs font-bold px-4 py-2 rounded-lg transition">
            ← Kembali ke Home
          </Link>
        </div>
      </div>

      {/* Daftar Firmware */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-4">
          {firmwareList.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-[#002b66] text-base">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Versi: <span className="font-semibold text-slate-700">{item.version}</span> | Ukuran: <span className="font-semibold text-slate-700">{item.size}</span></p>
              </div>
              <a 
                href={item.link} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow flex items-center gap-2"
              >
                📥 Unduh Firmware
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}