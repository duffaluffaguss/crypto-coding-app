import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated 404 illustration */}
        <div className="relative mb-8">
          <div className="text-[12rem] md:text-[16rem] font-bold text-primary/10 select-none leading-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-bounce">
              <span className="text-7xl md:text-8xl" role="img" aria-label="Lost astronaut">
                🧑‍🚀
              </span>
            </div>
          </div>
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 animate-pulse">
            <span className="text-2xl opacity-60">✨</span>
          </div>
          <div className="absolute top-1/3 right-1/4 animate-pulse delay-300">
            <span className="text-xl opacity-40">⭐</span>
          </div>
          <div className="absolute bottom-1/4 left-1/3 animate-pulse delay-500">
            <span className="text-lg opacity-50">💫</span>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
          Lost in the Blockchain?
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          This page seems to have been deployed to another dimension. 
          Don&apos;t worry, we&apos;ll help you find your way back!
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
          >
            <svg
              className="mr-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go Home
          </Link>
          <Link
            href="/showcase"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold border border-border rounded-lg hover:bg-card transition-all"
          >
            <svg
              className="mr-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Browse Showcase
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold border border-border rounded-lg hover:bg-card transition-all"
          >
            <svg
              className="mr-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Start Learning
          </Link>
        </div>

        {/* Search suggestion */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Looking for something specific? Try these popular destinations:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Projects', href: '/showcase' },
              { label: 'Leaderboard', href: '/leaderboard' },
              { label: 'Profile', href: '/profile' },
              { label: 'Settings', href: '/settings' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm bg-secondary hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
