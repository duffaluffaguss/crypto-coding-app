'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { resetTour } from '@/lib/tour';

export function RestartTourButton() {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleRestart = () => {
    resetTour();
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestart}
        className="gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        Restart Tour
      </Button>
      {showConfirmation && (
        <span className="text-sm text-green-500 animate-in fade-in slide-in-from-left-2">
          ✓ Tour reset! It will show on your next project visit.
        </span>
      )}
    </div>
  );
}
