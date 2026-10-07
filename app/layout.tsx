import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import DisclaimerGate from '@/components/DisclaimerGate';
import { AppProvider } from '@/lib/store';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Attendly — attendance credit for placement drives',
  description:
    'Your parents keep asking why you are always the defaulter. Tick the hours you missed for a placement drive and see your real attendance percentage.',
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
