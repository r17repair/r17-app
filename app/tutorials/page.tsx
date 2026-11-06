import FirebaseTutorialCatalog from "@/components/FirebaseTutorialCatalog";
import Header from "@/components/Header";

export default function TutorialsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <div className="bg-[#002b66] px-8 py-6 text-white shadow">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-xl font-extrabold uppercase tracking-wide">
              💡 Tutorial &amp; Panduan Teknisi
            </h1>
            <p className="mt-1 text-xs text-sky-200">
              Panduan servis dan materi teknis dari direktori R17 Repair.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <FirebaseTutorialCatalog />
        </div>
      </main>
    </div>
  );
}
