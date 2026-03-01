"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { GOBY_FISH_COMPONENTS, type GobySpecies } from '@/lib/gobies';

const NAV_LINKS = [
  {
    href: '/plans/generate',
    label: 'Generate',
    icon: (
      <svg width="18" height="12" viewBox="0 0 80 50" fill="none">
        <ellipse cx="38" cy="25" rx="26" ry="13" fill="currentColor"/>
        <path d="M64 25 C72 15, 78 12, 76 25 C78 38, 72 35, 64 25Z" fill="currentColor"/>
        <path d="M12 25 C8 20, 4 18, 6 25 C4 32, 8 30, 12 25Z" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
  },
  {
    href: '/plans',
    label: 'History',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
] as const;

function isTabActive(href: string, pathname: string): boolean {
  if (href === '/plans/generate') return pathname === '/plans/generate';
  if (href === '/plans') {
    return (
      pathname === '/plans' ||
      (pathname.startsWith('/plans/') && !pathname.startsWith('/plans/generate'))
    );
  }
  return false;
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userInitials, setUserInitials] = useState('?');
  const [gobySpecies, setGobySpecies] = useState<GobySpecies | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const name = (user.user_metadata?.full_name as string | undefined) || user.email || '';
      setUserInitials(name.charAt(0).toUpperCase() || '?');
      const { data: profile } = await supabase
        .from('profiles')
        .select('goby_species')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.goby_species) {
        setGobySpecies(profile.goby_species as GobySpecies);
      }
    }
    void fetchUserData();
  }, []);

  // Auth: full-page layout owned by AuthForm
  if (pathname.startsWith('/auth')) {
    return <>{children}</>;
  }

  // Full-page routes: no shell wrapper — each page owns its own layout
  if (
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/welcome') ||
    pathname.startsWith('/profile')
  ) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Fog viewport backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'var(--fog)', zIndex: 0 }}
        aria-hidden="true"
      />
      {/* Decorative blobs */}
      <div
        style={{
          position: 'fixed', width: '320px', height: '320px', borderRadius: '50%',
          top: '-120px', right: '-80px', zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(59,158,191,0.08) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: 'fixed', width: '260px', height: '260px', borderRadius: '50%',
          bottom: '80px', left: '-100px', zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(245,200,0,0.07) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Page container */}
      <div style={{
        maxWidth: '42rem', margin: '0 auto', minHeight: '100vh',
        backgroundColor: 'var(--fog)',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M0 40 C25 35, 50 45, 75 40 C100 35, 125 45, 150 40 C175 35, 200 45, 200 40' stroke='%233B9EBF' stroke-width='0.6' fill='none' opacity='0.07'/%3E%3Cpath d='M0 80 C30 75, 55 85, 80 80 C110 75, 130 85, 160 80 C180 75, 200 85, 200 80' stroke='%233B9EBF' stroke-width='0.6' fill='none' opacity='0.05'/%3E%3Cpath d='M0 120 C20 115, 50 125, 80 120 C110 115, 140 125, 160 120 C180 115, 200 125, 200 120' stroke='%233B9EBF' stroke-width='0.6' fill='none' opacity='0.06'/%3E%3Cpath d='M0 160 C25 155, 60 165, 90 160 C120 155, 150 165, 175 160 C185 155, 200 165, 200 160' stroke='%233B9EBF' stroke-width='0.6' fill='none' opacity='0.04'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <header style={{
          padding: '52px 24px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          animation: 'fadeUp 0.4s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="36" height="36" viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="38" cy="25" rx="26" ry="13" fill="#F5C800" />
              <path d="M64 25 C72 15, 78 12, 76 25 C78 38, 72 35, 64 25Z" fill="#F5C800" />
              <ellipse cx="20" cy="22" rx="3.5" ry="3.5" fill="#1A1A2A" />
              <ellipse cx="21" cy="21" rx="1.2" ry="1.2" fill="white" />
              <path d="M30 20 C33 18, 36 18, 38 20" stroke="#D4A900" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M12 25 C8 20, 4 18, 6 25 C4 32, 8 30, 12 25Z" fill="#D4A900" />
            </svg>
            <span style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '26px', fontWeight: 700,
              color: 'var(--ink)', letterSpacing: '-0.5px',
            }}>
              goby
            </span>
          </div>
          {(() => {
            const FishComponent = gobySpecies ? GOBY_FISH_COMPONENTS[gobySpecies] : null;
            return (
              <Link
                href="/profile"
                className="goby-avatar"
                style={FishComponent ? {
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'white', borderRadius: 'var(--radius-sm)',
                  padding: '5px 8px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  flexShrink: 0, textDecoration: 'none',
                } : {
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 600, color: 'var(--yolk)',
                  fontFamily: 'var(--font-dm-sans)',
                  flexShrink: 0, textDecoration: 'none',
                }}
              >
                {FishComponent ? <FishComponent width={40} height={25} /> : userInitials}
              </Link>
            );
          })()}
        </header>

        {/* Navigation tabs */}
        <div style={{ animation: 'fadeUp 0.4s ease 0.1s both', margin: '0 24px 28px' }}>
          <nav style={{
            background: 'white', borderRadius: 'var(--radius)',
            padding: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex',
          }}>
            {NAV_LINKS.map(({ href, label, icon }) => {
              const active = isTabActive(href, pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  className="goby-nav-tab"
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '6px', padding: '10px 8px', borderRadius: '12px',
                    fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 500,
                    background: active ? 'var(--ink)' : 'transparent',
                    color: active ? 'var(--water)' : 'var(--ink-soft)',
                    textDecoration: 'none',
                  }}
                >
                  {icon}
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Page content */}
        <main style={{ paddingBottom: '40px' }}>
          {children}
        </main>
      </div>
    </>
  );
}
