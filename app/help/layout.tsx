import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help & FAQ | Zero to Crypto Dev',
  description: 'Get help with Zero to Crypto Dev. Find answers to frequently asked questions about Web3 development, smart contracts, and our platform.',
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
