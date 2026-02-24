"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/plans/generate", label: "Generate" },
  { href: "/plans", label: "History" },
];

export function TopNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth") || pathname.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav className="mt-4 flex gap-2" aria-label="Primary">
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : link.href === "/plans"
              ? pathname === "/plans" || /^\/plans\/[^/]+\/complete$/.test(pathname)
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch={false}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              active
                ? "bg-sky-500 text-slate-950"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
