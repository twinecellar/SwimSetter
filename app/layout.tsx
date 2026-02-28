import type { Metadata } from 'next';
import { TopNav } from '@/app/components/TopNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'SwimSetter',
  description: 'Simple swim plans on the fly'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6">
          <header className="mb-6 border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-semibold tracking-tight">SwimSetter</h1>
            <p className="mt-1 text-sm text-slate-400">
              Generate quick, personalized swim sessions.
            </p>
            <TopNav />
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
