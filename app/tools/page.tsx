import AuthGuard from "@/components/AuthGuard";
import FirebaseFileCatalog from "@/components/FirebaseFileCatalog";
import Link from "next/link";

export default function ToolsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        <div className="bg-[#002b66] text-white py-6 px-8 shadow">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-xl font-extrabold uppercase tracking-wide">🛠️ PC Tools &amp; Drivers Repository</h1>
              <p className="text-xs text-sky-200 mt-1">
                Koleksi software flashing, tool repair, dan driver komputer esensial untuk teknisi.
              </p>
            </div>
            <Link href="/" className="bg-[#0066cc] hover:bg-[#0055aa] text-white text-xs font-bold px-4 py-2 rounded-lg transition">
              ← Kembali ke Home
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <FirebaseFileCatalog path="tools" />
        </div>
      </div>
    </AuthGuard>
  );
}