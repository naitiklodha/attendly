import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { AppProvider } from '@/lib/store';
import './globals.css';

export const metadata: Metadata = {
  title: 'Attendance Calculator — Placement Excusals',
  description:
    'Per-subject attendance with placement-drive hour excusals, reported in NMIMS sheet format.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
