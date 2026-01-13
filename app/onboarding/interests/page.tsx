'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { INTERESTS, type InterestId } from '@/types';
import {
  Palette,
  Camera,
  Gamepad2,
  Music,
  Trophy,
  Shirt,
  GraduationCap,
  Leaf,
  UtensilsCrossed,
  Plane,
  Dumbbell,
  Cpu,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette,
  Camera,
  Gamepad2,
  Music,
  Trophy,
  Shirt,
  GraduationCap,
  Leaf,
  UtensilsCrossed,
  Plane,
  Dumbbell,
  Cpu,
};

export default function InterestsPage() {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<InterestId[]>([]);

  const toggleInterest = (id: InterestId) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    if (selectedInterests.length === 0) return;

    // Store in session storage for the next step
    sessionStorage.setItem('onboarding_interests', JSON.stringify(selectedInterests));
    router.push('/onboarding/experience');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">What are you passionate about?</h1>
        <p className="text-muted-foreground">
          Select your interests and we&apos;ll create a personalized Web3 project just for you.
          <br />
          <span className="text-sm">(Select at least 1, up to 3 for best results)</span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {INTERESTS.map((interest) => {
          const Icon = iconMap[interest.icon];
          const isSelected = selectedInterests.includes(interest.id);
          const isDisabled = !isSelected && selectedInterests.length >= 3;

          return (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              disabled={isDisabled}
              className={`
                p-4 rounded-xl border-2 transition-all text-left
                ${isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50 bg-card'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                  `}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{interest.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={selectedInterests.length === 0}
          className="px-8"
        >
          Continue
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
        <div className="w-8 h-2 rounded-full bg-muted" />
        <div className="w-8 h-2 rounded-full bg-muted" />
      </div>
    </div>
  );
}
