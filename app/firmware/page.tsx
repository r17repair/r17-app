// app/firmware/page.tsx
import AuthGuard from "@/components/AuthGuard";
import FirebaseFileCatalog from "@/components/FirebaseFileCatalog";
import Header from "@/components/Header";

export default function FirmwarePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main>
          <div className="bg-[#002b66] text-white py-6 px-8 shadow">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-xl font-extrabold uppercase tracking-wide">📦 Firmware Center Repository</h1>
              <p className="text-xs text-sky-200 mt-1">
                Pusat unduhan berkas flash ROM resmi dan terverifikasi untuk teknisi.
              </p>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-6 py-8">
            <FirebaseFileCatalog path="firmware" />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}