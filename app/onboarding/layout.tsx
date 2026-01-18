import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between mb-12">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link href="/" className="text-2xl font-bold text-primary">
            Zero to Crypto Dev
          </Link>
          <div className="w-16" /> {/* Spacer for centering */}
        </nav>
        {children}
      </div>
    </div>
  );
}
