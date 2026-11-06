// app/page.tsx
import Header from "@/components/Header";
import DownloadBox from "@/components/DownloadBox";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#002b66] via-[#0066cc] to-[#0099ff] text-white py-12 px-6 border-b-4 border-[#0099ff]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-3">
            R17 Repair Portal &amp; Micro-App Hub
          </h1>
          <p className="text-sm text-sky-100 max-w-2xl">
            Pusat kendali aplikasi Vercel untuk manajemen firmware, skema jalur, dan autentikasi sesi aman terintegrasi Firebase.
          </p>
        </div>
      </section>

      {/* Konten Utama & Kotak Unduhan Real-time */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div>
          <h2 className="font-extrabold text-[#002b66] text-lg mb-4 uppercase tracking-wide">
            Direktori File Unggulan
          </h2>
          {/* Uji Coba Komponen Counter Realtime Database */}
          <DownloadBox fileId="firmware_xiaomi_note10" fileName="Xiaomi Redmi Note 10 Pro Stock ROM" />
          <DownloadBox fileId="schematic_oppo_reno5" fileName="Oppo Reno 5 Boardview & Bitmap Schematic" />
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
          <h3 className="font-bold text-[#002b66] text-base mb-2">🔐 Firebase Status Node</h3>
          <p className="text-xs text-slate-600 mb-4">
            Data unduhan di atas terhubung langsung ke Firebase Realtime Database secara sinkron dan instan.
          </p>
          <div className="bg-slate-100 p-3 rounded text-[11px] text-slate-700 font-mono">
            Database URL: r17-repair-default-rtdb.firebaseio.com
          </div>
        </div>
      </div>
    </main>
  );
}