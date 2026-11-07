import AuthGuard from "@/components/AuthGuard";
import FirebaseFileCatalog from "@/components/FirebaseFileCatalog";

export default function FirmwarePage() {
  return (
    <AuthGuard>
      <main className="flex-1 bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
              R17 Vault
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Firmware &amp; Software
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Pusat direktori firmware dan berkas software untuk mendukung pekerjaan servis.
            </p>
          </div>
        </section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <FirebaseFileCatalog path="firmware" />
        </div>
      </main>
    </AuthGuard>
  );
}
