import type { Metadata } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import { LayoutShell } from '@/app/components/LayoutShell';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'goby',
  description: 'Simple swim plans on the fly'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-white text-slate-900">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
