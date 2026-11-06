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

      {/* Bagian Tutorial & Panduan Servis Cepat */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-lg font-extrabold text-[#002b66] mb-4 flex items-center gap-2">
          💡 Panduan &amp; Tutorial Teknisi Pilihan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">Bypass FRP</span>
            <h3 className="font-bold text-slate-800 text-sm mt-2">Cara Bypass FRP Semua Versi Android Mediatek Terbaru</h3>
            <p className="text-xs text-slate-500 mt-1">Panduan lengkap langkah demi langkah melewati verifikasi akun Google setelah reset pabrik.</p>
            <span className="text-xs text-sky-600 font-bold mt-3 inline-block cursor-pointer hover:underline">Baca Selengkapnya →</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Dead Boot</span>
            <h3 className="font-bold text-slate-800 text-sm mt-2">Analisis Kerusakan Ponsel Mati Total (Dead Boot Repair)</h3>
            <p className="text-xs text-slate-500 mt-1">Teknik pengecekan menggunakan Power Supply dan hukum Ohm dasar untuk melacak jalur short.</p>
            <span className="text-xs text-sky-600 font-bold mt-3 inline-block cursor-pointer hover:underline">Baca Selengkapnya →</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">Emem / UFS</span>
            <h3 className="font-bold text-slate-800 text-sm mt-2">Teknik Pembacaan IC eMMC &amp; UFS Menggunakan EasyJTAG</h3>
            <p className="text-xs text-slate-500 mt-1">Solusi praktis dump file dan perbaikan partisi korup pada ponsel yang mengalami bootloop.</p>
            <span className="text-xs text-sky-600 font-bold mt-3 inline-block cursor-pointer hover:underline">Baca Selengkapnya →</span>
          </div>
        </div>
      </div>
    </main>
  );
}