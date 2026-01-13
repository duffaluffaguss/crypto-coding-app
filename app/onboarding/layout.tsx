import Link from 'next/link';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <nav className="flex justify-center mb-12">
          <Link href="/" className="text-2xl font-bold text-primary">
            Zero to Crypto Dev
          </Link>
        </nav>
        {children}
      </div>
    </div>
  );
}
