import FirebaseFileCatalog from "@/components/FirebaseFileCatalog";

export default function ToolsPage() {
  return (
      <main className="flex-1 bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
              R17 Vault
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Tools &amp; Drivers
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Koleksi software flashing, tool repair, dan driver komputer untuk teknisi.
            </p>
          </div>
        </section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <FirebaseFileCatalog path="tools" />
        </div>
      </main>
  );
}
