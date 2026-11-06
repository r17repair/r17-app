// components/Header.tsx
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Utility Bar Atas */}
      <div className="bg-[#0b1120] text-slate-400 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6 font-semibold">
            <Link href="https://r17repair.my.id/p/subscribe.html" className="hover:text-[#0099ff] transition-colors">Subscribe</Link>
            <Link href="https://r17repair.my.id/p/help.html" className="hover:text-[#0099ff] transition-colors">Help</Link>
            <Link href="https://r17repair.my.id/p/join.html" className="hover:text-[#0099ff] transition-colors">Join</Link>
            <Link href="https://r17repair.my.id/p/community.html" className="hover:text-[#0099ff] transition-colors">Community</Link>
          </div>
          <div>
            <span className="bg-emerald-900 text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
              ● VERCEL NODE ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-[#0099ff] overflow-hidden bg-slate-100 flex items-center justify-center font-bold text-[#002b66]">
            R17
          </div>
          <span className="font-extrabold text-[#002b66] text-sm md:text-base uppercase tracking-wide">
            R17 Repair Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button className="bg-[#0099ff] hover:bg-[#0077cc] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md">
            🔑 Login Teknisi
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar (Gradasi Biru Laut ke Biru Langit) */}
      <nav className="bg-gradient-to-r from-[#002b66] via-[#0066cc] to-[#0099ff] border-b-4 border-[#0099ff] overflow-x-auto">
        <div className="max-w-7xl mx-auto flex px-2 whitespace-nowrap">
          <Link href="/" className="px-4 py-3 text-white text-xs font-extrabold uppercase tracking-wider bg-black/20">Home Portal</Link>
          <Link href="https://firmware.r17repair.my.id" className="px-4 py-3 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-black/10 transition-colors">Firmware Center</Link>
          <Link href="https://schematic.r17repair.my.id" className="px-4 py-3 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-black/10 transition-colors">Schematic Center</Link>
          <Link href="https://tool.r17repair.my.id" className="px-4 py-3 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-black/10 transition-colors">PC Tools & Drivers</Link>
        </div>
      </nav>
    </header>
  );
}