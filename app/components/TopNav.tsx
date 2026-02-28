"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12.7596C5 11.4019 5 10.723 5.27446 10.1262C5.54892 9.52949 6.06437 9.08769 7.09525 8.20407L8.09525 7.34693C9.95857 5.7498 10.8902 4.95123 12 4.95123C13.1098 4.95123 14.0414 5.7498 15.9047 7.34693L16.9047 8.20407C17.9356 9.08769 18.4511 9.52949 18.7255 10.1262C19 10.723 19 11.4019 19 12.7596V17C19 18.8856 19 19.8284 18.4142 20.4142C17.8284 21 16.8856 21 15 21H9C7.11438 21 6.17157 21 5.58579 20.4142C5 19.8284 5 18.8856 5 17V12.7596Z" stroke="currentColor"/>
      <path d="M14.5 21V16C14.5 15.4477 14.0523 15 13.5 15H10.5C9.94772 15 9.5 15.4477 9.5 16V21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function HomeIconBold() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12.7596C5 11.4019 5 10.723 5.27446 10.1262C5.54892 9.52949 6.06437 9.08769 7.09525 8.20407L8.09525 7.34693C9.95857 5.7498 10.8902 4.95123 12 4.95123C13.1098 4.95123 14.0414 5.7498 15.9047 7.34693L16.9047 8.20407C17.9356 9.08769 18.4511 9.52949 18.7255 10.1262C19 10.723 19 11.4019 19 12.7596V17C19 18.8856 19 19.8284 18.4142 20.4142C17.8284 21 16.8856 21 15 21H9C7.11438 21 6.17157 21 5.58579 20.4142C5 19.8284 5 18.8856 5 17V12.7596Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M14.5 21V16C14.5 15.4477 14.0523 15 13.5 15H10.5C9.94772 15 9.5 15.4477 9.5 16V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GenerateIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 53 53" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.7 20.9C24.6 17.6 30 12 33.1 5C31.1 2.9 28.5 1.4 25.7 0.5L24.2 0C24.1 0.2 24 0.500012 24 0.700012C21.6 7.50001 16.7 13 10.1 16.1C5.50001 18.3 2.1 22.3 0.5 27.1L0 28.6C0.2 28.7 0.500005 28.8 0.700005 28.8C2.6 29.5 4.5 30.4 6.3 31.5C8.8 27 12.8 23.2 17.7 20.9Z" fill="currentColor"/>
      <path d="M46.7 21.3C43 26.9 37.9 31.4 31.6 34.4C26.5 36.8 22.6 41.3 20.8 46.7L20.3 48.4C22.2 50.1 24.5 51.4 27 52.2L28.5 52.7C28.6 52.5 28.7 52.2 28.7 52C31.1 45.2 36 39.7 42.6 36.6C47.2 34.4 50.7 30.4 52.2 25.6L52.7 24.1C50.6 23.5 48.6 22.5 46.7 21.3Z" fill="currentColor"/>
      <path d="M16.3 43.2C18.8 37.2 23.4 32.3 29.3 29.5C34.7 26.9 39.2 22.9 42.3 18C40 15.8 38.1 13.3 36.7 10.3C33 17.1 27.2 22.6 20.1 26C16 27.9 12.7 31.2 10.7 35.2C12.9 37.3 14.7 39.9 16.1 42.8C16.1 42.8 16.2 43 16.3 43.2Z" fill="currentColor"/>
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 6.5V18.5" stroke="currentColor" strokeLinecap="round"/>
      <path d="M20.5 6.5V18.5" stroke="currentColor" strokeLinecap="round"/>
      <path d="M3.5 6.5V18.5" stroke="currentColor" strokeLinecap="round"/>
      <path d="M20.5 18.5C20.5 18.5 19.5 16.5 16 16.5C12.5 16.5 12 18.5 12 18.5" stroke="currentColor" strokeLinecap="round"/>
      <path d="M3.5 18.5C3.5 18.5 4.5 16.5 8 16.5C11.5 16.5 12 18.5 12 18.5" stroke="currentColor" strokeLinecap="round"/>
      <path d="M20.5 6.5C20.5 6.5 19.5 4.5 16 4.5C12.5 4.5 12 6.5 12 6.5" stroke="currentColor" strokeLinecap="round"/>
      <path d="M3.5 6.5C3.5 6.5 4.5 4.5 8 4.5C11.5 4.5 12 6.5 12 6.5" stroke="currentColor" strokeLinecap="round"/>
    </svg>
  );
}

function HistoryIconBold() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 6V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M21 6L21 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M3 6L3 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M21 19C21 19 20 17 16.5 17C13 17 12 19 12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 19C12 19 11 17 7.5 17C4 17 3 19 3 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M21 6C21 6 20 4 16.5 4C13 4 12 6 12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 6C12 6 11 4 7.5 4C4 4 3 6 3 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

const LINKS = [
  { href: "/", label: "Home", Icon: HomeIcon, ActiveIcon: HomeIconBold },
  { href: "/plans/generate", label: "Generate", Icon: GenerateIcon },
  { href: "/plans", label: "History", Icon: HistoryIcon, ActiveIcon: HistoryIconBold },
];

export function TopNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth") || pathname.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav className="mt-4 flex rounded-xl bg-slate-900 p-1" aria-label="Primary">
      {LINKS.map(({ href, label, Icon, ActiveIcon }, index) => {
        const active =
          href === "/"
            ? pathname === "/"
            : href === "/plans"
              ? pathname === "/plans" || /^\/plans\/[^/]+\/complete$/.test(pathname)
              : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            aria-label={label}
            className={`relative flex flex-1 items-center justify-center rounded-lg py-3 transition-colors ${
              active
                ? "text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {index > 0 && (
              <span className="absolute inset-y-2 left-0 w-px bg-slate-700/60" />
            )}
            <span className={`transition-transform duration-150 ${active ? "scale-125" : "scale-100"}`}>
              {active && ActiveIcon ? <ActiveIcon /> : <Icon />}
            </span>
            {active && (
              <span className="absolute bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-sky-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
