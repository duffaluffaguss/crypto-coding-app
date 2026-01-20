import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Zero to Crypto Dev | Learn Web3 Development',
  description: 'Go from zero to crypto developer in 1-2 months. Build real projects, learn by doing, and deploy to the blockchain.',
  keywords: ['Web3', 'Solidity', 'Blockchain', 'Learn', 'Smart Contracts', 'Base'],
  openGraph: {
    title: 'Zero to Crypto Dev | Learn Web3 Development',
    description: 'Go from zero to crypto developer in 1-2 months. Build real projects, learn by doing, and deploy to the blockchain.',
    type: 'website',
    url: 'https://crypto-coding-app.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zero to Crypto Dev | Learn Web3 Development',
    description: 'Go from zero to crypto developer in 1-2 months. Build real projects, learn by doing.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
