import Link from "next/link";

const categories = [
  { label: "Tutorial & Panduan", href: "/tutorials" },
  { label: "Troubleshooting & Solusi", href: "/tutorials#troubleshooting" },
  { label: "Firmware & Software", href: "/firmware" },
  { label: "Schematic & Layout", href: "/schematic" },
  { label: "Tips & Trik Teknisi", href: "/tutorials#tips" },
  { label: "Tools & Drivers", href: "/tools" },
];

const legalPages = [
  { label: "Privacy Policy", href: "https://r17repair.my.id/p/privacy-policy.html" },
  { label: "Terms of Use", href: "https://r17repair.my.id/p/terms-of-use.html" },
  { label: "Disclaimer", href: "https://r17repair.my.id/p/disclaimer.html" },
  { label: "Contact Us", href: "https://r17repair.my.id/p/contact-us.html" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-100 text-slate-700">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-200 bg-white text-xs font-black text-sky-700">
              R17
            </span>
            <span className="text-sm font-extrabold tracking-wide text-slate-900">
              R17 REPAIR PORTAL
            </span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
            Ruang belajar dan direktori teknis untuk membantu teknisi memperbaiki perangkat dengan lebih terarah.
          </p>
          <p className="mt-3 max-w-md text-xs leading-5 text-slate-500">
            <strong className="text-slate-700">Visi &amp; misi:</strong> berbagi pengetahuan servis yang bermanfaat,
            memperluas akses materi teknis, dan mendukung komunitas teknisi Indonesia.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Kategori Utama
          </h2>
          <ul className="mt-4 space-y-2.5">
            {categories.map((category) => (
              <li key={category.label}>
                <Link
                  href={category.href}
                  className="text-sm text-slate-600 transition hover:text-sky-700"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Informasi &amp; Legal
          </h2>
          <ul className="mt-4 space-y-2.5">
            {legalPages.map((page) => (
              <li key={page.label}>
                <a
                  href={page.href}
                  className="text-sm text-slate-600 transition hover:text-sky-700"
                >
                  {page.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© R17 Repair. Hak cipta dilindungi.</span>
          <a href="https://r17repair.my.id" className="transition hover:text-sky-700">
            Kunjungi Blog Utama R17 Repair
          </a>
        </div>
      </div>
    </footer>
  );
}
