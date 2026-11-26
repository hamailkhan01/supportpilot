import Link from "next/link";
import { SITE } from "@/lib/site";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2.2}>
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
          <path d="M9 11h.01M12 11h.01M15 11h.01" strokeLinecap="round" />
        </svg>
      </span>
      {SITE.productName}
    </Link>
  );
}

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/#how" className="hidden rounded-md px-3 py-2 text-slate-600 hover:text-slate-900 sm:block">
            How it works
          </Link>
          <Link href="/#features" className="hidden rounded-md px-3 py-2 text-slate-600 hover:text-slate-900 sm:block">
            Features
          </Link>
          <a href={SITE.repoUrl} className="rounded-md px-3 py-2 text-slate-600 hover:text-slate-900">
            GitHub
          </a>
          <Link
            href="/dashboard"
            className="ml-1 rounded-lg bg-slate-900 px-3.5 py-2 font-medium text-white hover:bg-slate-700"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
