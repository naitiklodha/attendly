import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import DisclaimerGate from '@/components/DisclaimerGate';
import { AppProvider } from '@/lib/store';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const TITLE = 'Attendly — attendance calculator for placement drives';
const DESCRIPTION =
  'Upload your hour-wise attendance PDF, mark the lectures you missed for a placement drive, and see the corrected percentage for every subject. Runs entirely in your browser — no account, no uploads.';

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'Attendly',
  openGraph: {
    type: 'website',
    siteName: 'Attendly',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(GeistSans.variable, GeistMono.variable, "font-sans", geist.variable)}>
      <body>
        <AppProvider>
          <DisclaimerGate />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
