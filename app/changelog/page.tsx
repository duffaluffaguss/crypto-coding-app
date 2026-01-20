import Link from 'next/link';
import { changelog, CURRENT_VERSION } from '@/lib/changelog';
import { ChangelogEntry } from '@/components/changelog/ChangelogEntry';

export const metadata = {
  title: 'Changelog | Zero to Crypto Dev',
  description: 'See what\'s new in Zero to Crypto Dev. Latest features, improvements, and bug fixes.',
};

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <div className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              Zero to Crypto Dev
            </Link>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Log in
              </Link>
            </div>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">Changelog</h1>
          <p className="text-lg text-muted-foreground">
            Stay up to date with the latest features, improvements, and fixes
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
            <span className="text-muted-foreground">Current version:</span>
            <span className="font-semibold text-primary">v{CURRENT_VERSION}</span>
          </div>
        </div>

        {/* Changelog Timeline */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-xl border border-border p-6 md:p-8">
            {changelog.map((entry, index) => (
              <ChangelogEntry 
                key={entry.version} 
                entry={entry} 
                isLatest={index === 0}
              />
            ))}
          </div>

          {/* Subscribe CTA */}
          <div className="mt-8 text-center">
            <div className="inline-flex flex-col items-center p-6 rounded-xl border border-border bg-card">
              <svg className="w-8 h-8 text-primary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="font-semibold mb-1">Stay in the loop</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We&apos;ll notify you when we ship major updates
              </p>
              <Link
                href="/settings"
                className="text-sm font-medium text-primary hover:underline"
              >
                Manage notification preferences →
              </Link>
            </div>
          </div>

          {/* Back to Dashboard */}
          <div className="text-center pt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground text-sm">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link>
            <Link href="/showcase" className="hover:text-primary transition-colors">Showcase</Link>
            <Link href="/help" className="hover:text-primary transition-colors">Help</Link>
            <Link href="/changelog" className="hover:text-primary transition-colors font-medium text-primary">Changelog</Link>
          </div>
          <p>© 2026 Zero to Crypto Dev. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
