'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EXPERIENCE_LEVELS, type ExperienceLevel } from '@/types';

export default function ExperiencePage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    // Get interests from previous step
    const stored = sessionStorage.getItem('onboarding_interests');
    if (!stored) {
      router.push('/onboarding/interests');
      return;
    }
    setInterests(JSON.parse(stored));
  }, [router]);

  const handleContinue = () => {
    if (!selectedLevel) return;

    // Store experience level
    sessionStorage.setItem('onboarding_experience', selectedLevel);
    router.push('/onboarding/generate');
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">What&apos;s your coding background?</h1>
        <p className="text-muted-foreground">
          This helps us tailor the learning pace to your experience level.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {EXPERIENCE_LEVELS.map((level) => {
          const isSelected = selectedLevel === level.id;

          return (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={`
                w-full p-5 rounded-xl border-2 transition-all text-left
                ${isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50 bg-card'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${isSelected ? 'border-primary' : 'border-muted-foreground'}
                  `}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{level.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {level.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => router.push('/onboarding/interests')}
        >
          <svg
            className="mr-2 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!selectedLevel}
        >
          Generate My Projects
          <svg
            className="ml-2 w-4 h-4"
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
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mt-8">
        <div className="w-8 h-2 rounded-full bg-primary" />
        <div className="w-8 h-2 rounded-full bg-primary" />
        <div className="w-8 h-2 rounded-full bg-muted" />
      </div>
    </div>
  );
}
