import type { Metadata } from 'next';
import Image from 'next/image';
import { DM_Sans } from 'next/font/google';
import { TopNav } from '@/app/components/TopNav';
import { HeaderSubtitle } from '@/app/components/HeaderSubtitle';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
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
    <html lang="en" className={dmSans.variable}>
      <body className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6">
          <header className="mb-6 border-b border-slate-200 pb-4">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Image src="/goby_fish_v1.png" alt="SwimSetter logo" width={80} height={42} />
              goby
            </h1>
            <HeaderSubtitle />
            <TopNav />
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
