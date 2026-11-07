export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-slate-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
      <p className="mt-3 text-xs font-bold tracking-wide text-slate-700">MEMUAT DIREKTORI R17 REPAIR...</p>
    </div>
  );
}