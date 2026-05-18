import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Event Decision Engine',
  description: 'B2B SaaS Event Decision, Planning & ROI Tracking System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-slate-50 text-slate-900`}>
        <Sidebar />
        <main className="ml-60 min-h-screen">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </body>
    </html>
  );
}
