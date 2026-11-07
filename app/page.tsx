import Link from "next/link";
import DownloadBox from "@/components/DownloadBox";

const featuredGuides = [
  {
    category: "Troubleshooting",
    title: "Analisis kerusakan ponsel mati total",
    description:
      "Panduan pengecekan dasar menggunakan power supply dan hukum Ohm untuk menelusuri jalur short.",
  },
  {
    category: "Tips Teknisi",
    title: "Pemeriksaan awal sebelum proses flashing",
    description:
      "Langkah persiapan untuk membantu proses servis software berjalan lebih aman dan terarah.",
  },
  {
    category: "Firmware & Software",
    title: "Panduan memilih firmware yang sesuai",
    description:
      "Kenali model perangkat, versi, dan detail berkas sebelum memulai proses perbaikan.",
  },
];

export default function Home() {
  return (
    <main className="flex-1 bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            R17 Repair · Portal Teknisi
          </span>
          <div className="mt-5 max-w-3xl">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
              Referensi servis dan direktori teknis, dalam satu tempat.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Temukan tutorial, troubleshooting, firmware, schematic, dan software untuk mendukung
              pekerjaan teknisi sehari-hari.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/tutorials"
                className="rounded-lg bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
              >
                Jelajahi Panduan
              </Link>
              <a
                href="https://r17repair.my.id"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                Kunjungi Blog Utama
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
                Direktori R17 Vault
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Berkas pilihan</h2>
            </div>
            <Link href="/firmware" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
              Lihat direktori
            </Link>
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <DownloadBox
                fileId="firmware_xiaomi_note10"
                fileName="Xiaomi Redmi Note 10 Pro Stock ROM"
                filePath="firmware/firmware_xiaomi_note10"
              />
              <DownloadBox
                fileId="schematic_oppo_reno5"
                fileName="Oppo Reno 5 Boardview & Bitmap Schematic"
                filePath="schematic/schematic_oppo_reno5"
              />
            </div>
            <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                Tentang Vault
              </span>
              <h3 className="mt-2 text-base font-bold text-slate-900">Direktori file R17 Repair</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Katalog file terhubung ke Firebase Realtime Database. Ketersediaan unduhan
                mengikuti tautan yang disediakan pada masing-masing item.
              </p>
              <Link
                href="/firmware"
                className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-700"
              >
                Buka Firmware &amp; Software
              </Link>
            </aside>
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
                Wawasan Teknisi
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Panduan dan topik pilihan</h2>
            </div>
            <Link href="/tutorials" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
              Semua tutorial
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featuredGuides.map((guide) => (
              <Link
                key={guide.title}
                href="/tutorials"
                className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-sky-500"
              >
                <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                  {guide.category}
                </span>
                <h3 className="mt-3 text-sm font-bold leading-5 text-slate-900">{guide.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">{guide.description}</p>
                <span className="mt-4 inline-block text-xs font-bold text-sky-700 group-hover:text-sky-800">
                  Jelajahi panduan
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
