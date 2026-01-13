import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Zero to Crypto Dev | Learn Web3 Development',
  description: 'Go from zero to crypto developer in 1-2 months. Build real projects, learn by doing, and deploy to the blockchain.',
  keywords: ['Web3', 'Solidity', 'Blockchain', 'Learn', 'Smart Contracts', 'Base'],
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
      </body>
    </html>
  );
}
