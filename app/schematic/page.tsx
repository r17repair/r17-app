import FirebaseFileCatalog from "@/components/FirebaseFileCatalog";

export default function SchematicPage() {
  return (
      <main className="flex-1 bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
              R17 Vault
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Schematic &amp; Layout
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Koleksi skema jalur, layout boardview, dan materi pendukung perbaikan perangkat.
            </p>
          </div>
        </section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <FirebaseFileCatalog path="schematics" />
        </div>
      </main>
  );
}
