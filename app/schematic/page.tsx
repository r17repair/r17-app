// app/schematic/page.tsx
"use layout";
"use client";

import Link from "next/link";

export default function SchematicPage() {
  const schematicList = [
    { id: 1, title: "Oppo Reno 5 Boardview & Bitmap Schematic", type: "Boardview (.brd)", size: "45 MB", link: "#" },
    { id: 2, title: "iPhone 11 Pro Max Complete Schematic Diagram", type: "PDF Schematic", size: "18.5 MB", link: "#" },
    { id: 3, title: "Samsung Galaxy M31 Hardware Solution Jumper", type: "Image / PDF", size: "12 MB", link: "#" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Sederhana */}
      <div className="bg-[#002b66] text-white py-6 px-8 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-wide">📐 Schematic &amp; Bitmap Center</h1>
            <p className="text-xs text-sky-200 mt-1">Koleksi skema jalur, layout boardview, dan solusinya untuk teknisi handphone.</p>
          </div>
          <Link href="/" className="bg-[#0066cc] hover:bg-[#0055aa] text-white text-xs font-bold px-4 py-2 rounded-lg transition">
            ← Kembali ke Home
          </Link>
        </div>
      </div>

      {/* Daftar Skema */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-4">
          {schematicList.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-[#002b66] text-base">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Jenis: <span className="font-semibold text-slate-700">{item.type}</span> | Ukuran: <span className="font-semibold text-slate-700">{item.size}</span></p>
              </div>
              <a 
                href={item.link} 
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow flex items-center gap-2"
              >
                👁️ Buka Skema
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}