import FirebaseTutorialCatalog from "@/components/FirebaseTutorialCatalog";

export default function TutorialsPage() {
  return (
    <main className="flex-1 bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Wawasan R17</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
            Tutorial &amp; Panduan Teknisi
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Panduan servis, troubleshooting, dan materi teknis dari direktori R17 Repair.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FirebaseTutorialCatalog />
      </div>
    </main>
  );
}
