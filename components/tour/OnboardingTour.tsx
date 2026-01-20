'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { 
  TourStep, 
  IDE_TOUR_STEPS, 
  markTourCompleted, 
  shouldShowTour 
} from '@/lib/tour';

interface OnboardingTourProps {
  projectId: string;
  onComplete?: () => void;
  forceShow?: boolean; // Allow forcing the tour to show (for restart)
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingTour({ projectId, onComplete, forceShow = false }: OnboardingTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const steps = IDE_TOUR_STEPS;
  const step = steps[currentStep];

  // Check if tour should be shown on mount
  useEffect(() => {
    setMounted(true);
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (forceShow || shouldShowTour(projectId)) {
        setIsActive(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [projectId, forceShow]);

  // Calculate tooltip and spotlight positions
  const calculatePositions = useCallback(() => {
    if (!step || !isActive) return;

    const targetElement = document.querySelector(step.target);
    if (!targetElement) {
      console.warn(`Tour target not found: ${step.target}`);
      // Try to skip to next step if target not found
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const padding = step.spotlightPadding || 8;

    // Set spotlight rectangle
    setSpotlightRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position based on placement
    const tooltipWidth = 320;
    const tooltipHeight = 180; // Approximate
    const gap = 16;

    let top = 0;
    let left = 0;
    let arrowPosition: TooltipPosition['arrowPosition'] = step.placement;

    switch (step.placement) {
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'bottom';
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'top';
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        arrowPosition = 'right';
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        arrowPosition = 'left';
        break;
    }

    // Ensure tooltip stays in viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 16) left = 16;
    if (left + tooltipWidth > viewportWidth - 16) left = viewportWidth - tooltipWidth - 16;
    if (top < 16) top = 16;
    if (top + tooltipHeight > viewportHeight - 16) top = viewportHeight - tooltipHeight - 16;

    setTooltipPosition({ top, left, arrowPosition });
  }, [step, currentStep, steps.length, isActive]);

  // Recalculate on step change or window resize
  useEffect(() => {
    calculatePositions();

    const handleResize = () => calculatePositions();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [calculatePositions]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    markTourCompleted();
    setIsActive(false);
    onComplete?.();
  };

  const handleComplete = () => {
    markTourCompleted();
    setIsActive(false);
    onComplete?.();
  };

  if (!mounted || !isActive || !step) return null;

  const tourContent = (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Onboarding Tour">
      {/* Overlay with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'normal' }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left}
                y={spotlightRect.top}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
          className="pointer-events-auto"
          onClick={handleSkip}
        />
      </svg>

      {/* Spotlight border glow */}
      {spotlightRect && (
        <div
          className="absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none animate-pulse"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPosition && (
        <div
          ref={tooltipRef}
          className="absolute bg-card border border-border rounded-xl shadow-2xl p-5 w-80 animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {/* Arrow */}
          <div
            className={`absolute w-3 h-3 bg-card border-border rotate-45 ${
              tooltipPosition.arrowPosition === 'top'
                ? '-top-1.5 left-1/2 -translate-x-1/2 border-l border-t'
                : tooltipPosition.arrowPosition === 'bottom'
                ? '-bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b'
                : tooltipPosition.arrowPosition === 'left'
                ? '-left-1.5 top-1/2 -translate-y-1/2 border-l border-b'
                : '-right-1.5 top-1/2 -translate-y-1/2 border-r border-t'
            }`}
          />

          {/* Step indicator */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tour
            </button>
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-primary w-4'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="text-muted-foreground"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="gap-1"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Get Started
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Use portal to render at document body level
  return createPortal(tourContent, document.body);
}

// Hook for manually triggering the tour
export function useTour() {
  const [showTour, setShowTour] = useState(false);

  const startTour = useCallback(() => {
    setShowTour(true);
  }, []);

  const endTour = useCallback(() => {
    setShowTour(false);
  }, []);

  return { showTour, startTour, endTour };
}
