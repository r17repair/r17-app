import Link from "next/link";

interface BreadcrumbProps {
  category: string;
  categoryHref: string;
  title: string;
}

export default function Breadcrumb({ category, categoryHref, title }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-[11px] text-slate-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="transition hover:text-sky-700">
            Beranda
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href={categoryHref} className="transition hover:text-sky-700">
            {category}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="max-w-full truncate text-slate-600">
          {title}
        </li>
      </ol>
    </nav>
  );
}
