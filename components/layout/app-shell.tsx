import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";

interface NavItem {
  label: string;
  href: string;
  // Routes under this prefix keep the item active (e.g. Analysis stays active inside a company page).
  match: string;
  // Only these three pages are available on mobile (read-only).
  mobile: boolean;
}

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/", match: "/", mobile: true },
  { label: "Analysis", href: "/companies", match: "/companies", mobile: true },
  { label: "Trade journal", href: "/trades", match: "/trades", mobile: false },
  { label: "Scorecard", href: "/scorecard", match: "/scorecard", mobile: true },
  { label: "Results calendar", href: "/calendar", match: "/calendar", mobile: false },
  { label: "Checklists", href: "/checklists", match: "/checklists", mobile: false },
  { label: "Import", href: "/import", match: "/import", mobile: false },
];

function isActive(pathname: string, item: NavItem) {
  return item.match === "/" ? pathname === "/" : pathname.startsWith(item.match);
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { pathname } = useRouter();

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-58 border-r border-slate-200 bg-white md:block">
        <div className="flex h-14 items-center border-b border-slate-200 px-4 font-semibold text-slate-900">
          Research Desk
        </div>
        <nav aria-label="Main" className="flex flex-col gap-0.5 p-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item) ? "page" : undefined}
              className={`flex h-9 items-center rounded-md px-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                isActive(pathname, item)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="md:pl-58">
        <header className="flex h-14 items-center border-b border-slate-200 bg-white px-4 md:px-6">
          <span className="font-semibold text-slate-900 md:hidden">{title}</span>
          <input
            type="search"
            aria-label="Search companies and notes"
            placeholder="Search companies and notes"
            className="hidden h-9 w-80 rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:block"
          />
        </header>

        <nav aria-label="Mobile" className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 md:hidden">
          {NAV.filter((item) => item.mobile).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item) ? "page" : undefined}
              className={`flex min-h-11 items-center whitespace-nowrap px-3 text-sm font-medium ${
                isActive(pathname, item) ? "text-indigo-700" : "text-slate-500"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="mx-auto max-w-7xl p-4 md:p-6">
          <h1 className="mb-4 hidden text-2xl font-semibold text-slate-900 md:block">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
