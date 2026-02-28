"use client";

import { usePathname } from "next/navigation";

const SUBTITLES: Record<string, string> = {
  "/":               "Your swim cycle at a glance.",
  "/plans/generate": "Set your preferences and generate a session.",
  "/plans":          "Review your past sessions.",
};

export function HeaderSubtitle() {
  const pathname = usePathname();
  if (pathname.startsWith("/auth") || pathname.startsWith("/onboarding")) return null;
  const text = SUBTITLES[pathname] ?? null;
  if (!text) return null;
  return <p className="mt-1 text-sm text-slate-400">{text}</p>;
}
