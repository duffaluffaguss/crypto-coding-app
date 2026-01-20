// Tour step definitions and helpers

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or data attribute
  placement: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
}

export const IDE_TOUR_STEPS: TourStep[] = [
  {
    id: 'editor',
    title: 'This is your code editor',
    description: 'Write your Solidity smart contracts here. The editor has syntax highlighting, auto-completion, and saves automatically as you type.',
    target: '[data-tour="editor"]',
    placement: 'right',
    spotlightPadding: 8,
  },
  {
    id: 'lessons',
    title: 'Follow lessons here',
    description: 'Step-by-step lessons guide you through building your project. Complete each lesson to unlock achievements!',
    target: '[data-tour="lessons"]',
    placement: 'right',
    spotlightPadding: 8,
  },
  {
    id: 'chat',
    title: 'Ask Sol for help',
    description: 'Sol is your AI tutor. Ask questions about your code, get explanations, or request help with bugs. Sol sees your code and current lesson!',
    target: '[data-tour="chat"]',
    placement: 'left',
    spotlightPadding: 8,
  },
  {
    id: 'compile',
    title: 'Compile your code',
    description: 'Click Compile to check your code for errors. Fix any issues before deploying to the blockchain.',
    target: '[data-tour="compile"]',
    placement: 'bottom',
    spotlightPadding: 4,
  },
  {
    id: 'deploy',
    title: 'Deploy to blockchain',
    description: 'Once compiled, deploy your contract to a test network. Connect your wallet and bring your code to life!',
    target: '[data-tour="deploy"]',
    placement: 'bottom',
    spotlightPadding: 4,
  },
];

// LocalStorage keys
const TOUR_COMPLETED_KEY = 'crypto-coding-tour-completed';
const TOUR_PROJECT_PREFIX = 'crypto-coding-tour-project-';

/**
 * Check if the user has completed the IDE tour for any project
 */
export function hasTourBeenCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
}

/**
 * Check if the user has seen the tour for a specific project
 */
export function hasTourBeenShownForProject(projectId: string): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(`${TOUR_PROJECT_PREFIX}${projectId}`) === 'true';
}

/**
 * Mark the tour as completed globally
 */
export function markTourCompleted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
}

/**
 * Mark the tour as shown for a specific project
 */
export function markTourShownForProject(projectId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${TOUR_PROJECT_PREFIX}${projectId}`, 'true');
}

/**
 * Reset the tour so it shows again
 */
export function resetTour(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOUR_COMPLETED_KEY);
  // Also remove all project-specific tour flags
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(TOUR_PROJECT_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Check if the tour should be shown for this project visit
 * Returns true only on the first visit to the IDE
 */
export function shouldShowTour(projectId: string): boolean {
  if (typeof window === 'undefined') return false;
  // Show tour if user hasn't completed it globally
  return !hasTourBeenCompleted();
}
