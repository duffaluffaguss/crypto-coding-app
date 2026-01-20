import Link from 'next/link';
import FeatureCard from '@/components/landing/FeatureCard';
import TestimonialCard from '@/components/landing/TestimonialCard';
import StatsSection from '@/components/landing/StatsSection';

// Feature icons as components
const icons = {
  aiTutor: (
    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  realProjects: (
    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  blockchain: (
    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  progress: (
    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  community: (
    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  mobile: (
    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

const features = [
  {
    icon: icons.aiTutor,
    title: 'AI Tutor',
    description: 'Get instant help from an AI mentor that knows your project, your progress, and exactly where you\'re stuck.',
  },
  {
    icon: icons.realProjects,
    title: 'Real Projects',
    description: 'No toy examples. Build real Web3 apps based on your interests that you can actually share and monetize.',
  },
  {
    icon: icons.blockchain,
    title: 'Deploy to Blockchain',
    description: 'One-click deployment to Base. Your smart contracts go live in minutes, not days.',
  },
  {
    icon: icons.progress,
    title: 'Track Progress',
    description: 'Visual progress tracking, streaks, and achievements keep you motivated throughout your journey.',
  },
  {
    icon: icons.community,
    title: 'Community',
    description: 'Join thousands of builders learning Web3. Share projects, get feedback, and grow together.',
  },
  {
    icon: icons.mobile,
    title: 'Mobile Ready',
    description: 'Learn anywhere. Our platform works beautifully on any device, so you can code on the go.',
  },
];

const testimonials = [
  {
    quote: 'I went from zero coding experience to deploying my first NFT collection in 3 weeks. The AI tutor feels like having a senior dev sitting next to you 24/7.',
    name: 'Sarah Chen',
    role: 'Designer turned Web3 Developer',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4',
  },
  {
    quote: 'Finally, a coding course that doesn\'t bore you with theory for months. I was writing smart contracts on day one. Mind blown.',
    name: 'Marcus Johnson',
    role: 'Former Marketing Manager',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede',
  },
  {
    quote: 'The project-based approach is genius. I built a tipping app for my Twitch stream and actually use it every day now.',
    name: 'Alex Rivera',
    role: 'Content Creator',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=d1d4f9',
  },
  {
    quote: 'As someone who tried and failed with traditional coding bootcamps, this actually worked. The fill-in-the-blank approach makes complex concepts click.',
    name: 'Jordan Taylor',
    role: 'Freelance Developer',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan&backgroundColor=ffd5dc',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 md:py-16">
        <nav className="flex justify-between items-center mb-12 md:mb-16">
          <div className="text-xl md:text-2xl font-bold text-primary">
            Zero to Crypto Dev
          </div>
          <div className="flex gap-2 md:gap-4">
            <Link
              href="/login"
              className="px-3 md:px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-3 md:px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Now with AI-powered learning
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            Build Your First Web3 Project
          </h1>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8">
            In Under 2 Months
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
            Forget boring tutorials. Build a real project based on YOUR interests
            from Day 1, with an AI mentor guiding you every step of the way.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
            >
              Start Your Journey — Free
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold border border-border rounded-lg hover:bg-card transition-all"
            >
              See How It Works
            </Link>
          </div>
          
          {/* Social proof mini */}
          <p className="mt-8 text-sm text-muted-foreground">
            Join <span className="font-semibold text-foreground">2,500+</span> developers already building on Web3
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <StatsSection />

      {/* Features Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We&apos;ve built the most comprehensive platform for learning Web3 development, combining AI-powered tutoring with hands-on projects.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground">Three simple steps to become a Web3 developer</p>
            </div>
            
            <div className="space-y-8 md:space-y-12">
              <div className="flex gap-4 md:gap-6 items-start">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg md:text-xl shrink-0 shadow-lg shadow-primary/25">
                  1
                </div>
                <div className="pt-1">
                  <h3 className="text-xl md:text-2xl font-semibold mb-2">Tell Us Your Interests</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Love photography? Into gaming? Our AI generates 3 unique project ideas tailored to YOUR passions. No generic todo apps here.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 md:gap-6 items-start">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg md:text-xl shrink-0 shadow-lg shadow-primary/25">
                  2
                </div>
                <div className="pt-1">
                  <h3 className="text-xl md:text-2xl font-semibold mb-2">Fill in the Blanks</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We give you 80% of the code. You complete the critical parts—learning the concepts that matter as you go. Stuck? Your AI tutor is always ready.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 md:gap-6 items-start">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg md:text-xl shrink-0 shadow-lg shadow-primary/25">
                  3
                </div>
                <div className="pt-1">
                  <h3 className="text-xl md:text-2xl font-semibold mb-2">Deploy & Share</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    One click to deploy on Base. Share your project link with friends. You&apos;re now a Web3 developer with a live project to prove it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Builders</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of people who&apos;ve transformed their careers with Zero to Crypto Dev
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                quote={testimonial.quote}
                name={testimonial.name}
                role={testimonial.role}
                avatarUrl={testimonial.avatarUrl}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 via-primary/5 to-blue-400/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Build Your Future in Web3?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Stop watching tutorials. Start building real projects today. Your first deployment is just minutes away.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
            >
              Get Started for Free
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required • Start building in 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground text-sm">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link>
            <Link href="/showcase" className="hover:text-primary transition-colors">Showcase</Link>
            <Link href="/help" className="hover:text-primary transition-colors">Help & FAQ</Link>
          </div>
          <p>Built for the next generation of Web3 builders</p>
          <p className="mt-2">© 2026 Zero to Crypto Dev. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
