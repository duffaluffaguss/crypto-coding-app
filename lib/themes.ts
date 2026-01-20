export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
  };
  cssVariables: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export const presetThemes: ThemeDefinition[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and modern blue theme',
    emoji: '🔷',
    colors: {
      primary: 'rgb(59 130 246)', // blue-500
      secondary: 'rgb(71 85 105)', // slate-600
      accent: 'rgb(147 197 253)', // blue-300
      muted: 'rgb(241 245 249)', // slate-100
    },
    cssVariables: {
      light: {
        '--background': '0 0% 100%',
        '--foreground': '222.2 84% 4.9%',
        '--primary': '221.2 83.2% 53.3%',
        '--primary-foreground': '210 40% 98%',
        '--secondary': '210 40% 96.1%',
        '--secondary-foreground': '222.2 47.4% 11.2%',
        '--muted': '210 40% 96.1%',
        '--muted-foreground': '215.4 16.3% 46.9%',
        '--accent': '210 40% 96.1%',
        '--accent-foreground': '222.2 47.4% 11.2%',
        '--card': '0 0% 100%',
        '--card-foreground': '222.2 84% 4.9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '222.2 84% 4.9%',
        '--border': '214.3 31.8% 91.4%',
        '--input': '214.3 31.8% 91.4%',
        '--ring': '221.2 83.2% 53.3%',
      },
      dark: {
        '--background': '222.2 84% 4.9%',
        '--foreground': '210 40% 98%',
        '--primary': '217.2 91.2% 59.8%',
        '--primary-foreground': '222.2 47.4% 11.2%',
        '--secondary': '217.2 32.6% 17.5%',
        '--secondary-foreground': '210 40% 98%',
        '--muted': '217.2 32.6% 17.5%',
        '--muted-foreground': '215 20.2% 65.1%',
        '--accent': '217.2 32.6% 17.5%',
        '--accent-foreground': '210 40% 98%',
        '--card': '222.2 84% 4.9%',
        '--card-foreground': '210 40% 98%',
        '--popover': '222.2 84% 4.9%',
        '--popover-foreground': '210 40% 98%',
        '--border': '217.2 32.6% 17.5%',
        '--input': '217.2 32.6% 17.5%',
        '--ring': '224.3 76.3% 48%',
      },
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep blues and teals for a calming feel',
    emoji: '🌊',
    colors: {
      primary: 'rgb(6 182 212)', // cyan-500
      secondary: 'rgb(14 116 144)', // cyan-700
      accent: 'rgb(125 211 252)', // sky-300
      muted: 'rgb(240 249 255)', // sky-50
    },
    cssVariables: {
      light: {
        '--background': '0 0% 100%',
        '--foreground': '198 100% 5%',
        '--primary': '188 94% 43%', // cyan-500
        '--primary-foreground': '210 40% 98%',
        '--secondary': '199 89% 48%', // sky-500
        '--secondary-foreground': '210 40% 98%',
        '--muted': '204 100% 97%', // sky-50
        '--muted-foreground': '186 24% 44%',
        '--accent': '199 89% 48%',
        '--accent-foreground': '210 40% 98%',
        '--card': '0 0% 100%',
        '--card-foreground': '198 100% 5%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '198 100% 5%',
        '--border': '186 33% 87%',
        '--input': '186 33% 87%',
        '--ring': '188 94% 43%',
      },
      dark: {
        '--background': '198 100% 3%',
        '--foreground': '204 100% 97%',
        '--primary': '188 94% 43%',
        '--primary-foreground': '198 100% 3%',
        '--secondary': '198 89% 15%',
        '--secondary-foreground': '204 100% 97%',
        '--muted': '198 89% 15%',
        '--muted-foreground': '186 24% 65%',
        '--accent': '198 89% 15%',
        '--accent-foreground': '204 100% 97%',
        '--card': '198 100% 3%',
        '--card-foreground': '204 100% 97%',
        '--popover': '198 100% 3%',
        '--popover-foreground': '204 100% 97%',
        '--border': '198 89% 15%',
        '--input': '198 89% 15%',
        '--ring': '188 94% 43%',
      },
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural greens for a fresh, organic vibe',
    emoji: '🌲',
    colors: {
      primary: 'rgb(34 197 94)', // green-500
      secondary: 'rgb(21 128 61)', // green-700
      accent: 'rgb(134 239 172)', // green-300
      muted: 'rgb(240 253 244)', // green-50
    },
    cssVariables: {
      light: {
        '--background': '0 0% 100%',
        '--foreground': '120 100% 5%',
        '--primary': '142 76% 45%', // green-500
        '--primary-foreground': '356 100% 97%',
        '--secondary': '122 39% 49%', // green-600
        '--secondary-foreground': '356 100% 97%',
        '--muted': '138 76% 97%', // green-50
        '--muted-foreground': '142 24% 44%',
        '--accent': '122 39% 49%',
        '--accent-foreground': '356 100% 97%',
        '--card': '0 0% 100%',
        '--card-foreground': '120 100% 5%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '120 100% 5%',
        '--border': '142 33% 87%',
        '--input': '142 33% 87%',
        '--ring': '142 76% 45%',
      },
      dark: {
        '--background': '120 100% 3%',
        '--foreground': '138 76% 97%',
        '--primary': '142 76% 45%',
        '--primary-foreground': '120 100% 3%',
        '--secondary': '120 39% 15%',
        '--secondary-foreground': '138 76% 97%',
        '--muted': '120 39% 15%',
        '--muted-foreground': '142 24% 65%',
        '--accent': '120 39% 15%',
        '--accent-foreground': '138 76% 97%',
        '--card': '120 100% 3%',
        '--card-foreground': '138 76% 97%',
        '--popover': '120 100% 3%',
        '--popover-foreground': '138 76% 97%',
        '--border': '120 39% 15%',
        '--input': '120 39% 15%',
        '--ring': '142 76% 45%',
      },
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm oranges and yellows like a golden hour',
    emoji: '🌅',
    colors: {
      primary: 'rgb(251 146 60)', // orange-400
      secondary: 'rgb(194 65 12)', // orange-700
      accent: 'rgb(254 215 170)', // orange-200
      muted: 'rgb(255 251 235)', // orange-50
    },
    cssVariables: {
      light: {
        '--background': '0 0% 100%',
        '--foreground': '20 100% 8%',
        '--primary': '24 95% 61%', // orange-400
        '--primary-foreground': '20 14% 4%',
        '--secondary': '20 95% 48%', // orange-600
        '--secondary-foreground': '60 9% 98%',
        '--muted': '33 100% 96%', // orange-50
        '--muted-foreground': '24 24% 44%',
        '--accent': '20 95% 48%',
        '--accent-foreground': '60 9% 98%',
        '--card': '0 0% 100%',
        '--card-foreground': '20 100% 8%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '20 100% 8%',
        '--border': '24 33% 87%',
        '--input': '24 33% 87%',
        '--ring': '24 95% 61%',
      },
      dark: {
        '--background': '20 100% 4%',
        '--foreground': '33 100% 96%',
        '--primary': '24 95% 61%',
        '--primary-foreground': '20 100% 4%',
        '--secondary': '20 39% 15%',
        '--secondary-foreground': '33 100% 96%',
        '--muted': '20 39% 15%',
        '--muted-foreground': '24 24% 65%',
        '--accent': '20 39% 15%',
        '--accent-foreground': '33 100% 96%',
        '--card': '20 100% 4%',
        '--card-foreground': '33 100% 96%',
        '--popover': '20 100% 4%',
        '--popover-foreground': '33 100% 96%',
        '--border': '20 39% 15%',
        '--input': '20 39% 15%',
        '--ring': '24 95% 61%',
      },
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep purples and indigos for night owls',
    emoji: '🌙',
    colors: {
      primary: 'rgb(147 51 234)', // purple-500
      secondary: 'rgb(88 28 135)', // purple-800
      accent: 'rgb(196 181 253)', // purple-300
      muted: 'rgb(250 245 255)', // purple-50
    },
    cssVariables: {
      light: {
        '--background': '0 0% 100%',
        '--foreground': '263 100% 8%',
        '--primary': '262 83% 58%', // purple-500
        '--primary-foreground': '210 40% 98%',
        '--secondary': '263 69% 42%', // purple-700
        '--secondary-foreground': '210 40% 98%',
        '--muted': '270 100% 98%', // purple-50
        '--muted-foreground': '262 24% 44%',
        '--accent': '263 69% 42%',
        '--accent-foreground': '210 40% 98%',
        '--card': '0 0% 100%',
        '--card-foreground': '263 100% 8%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '263 100% 8%',
        '--border': '262 33% 87%',
        '--input': '262 33% 87%',
        '--ring': '262 83% 58%',
      },
      dark: {
        '--background': '263 100% 4%',
        '--foreground': '270 100% 98%',
        '--primary': '262 83% 58%',
        '--primary-foreground': '263 100% 4%',
        '--secondary': '263 39% 15%',
        '--secondary-foreground': '270 100% 98%',
        '--muted': '263 39% 15%',
        '--muted-foreground': '262 24% 65%',
        '--accent': '263 39% 15%',
        '--accent-foreground': '270 100% 98%',
        '--card': '263 100% 4%',
        '--card-foreground': '270 100% 98%',
        '--popover': '263 100% 4%',
        '--popover-foreground': '270 100% 98%',
        '--border': '263 39% 15%',
        '--input': '263 39% 15%',
        '--ring': '262 83% 58%',
      },
    },
  },
];

// Convert hex color to HSL
export function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 50%';

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Apply theme to the document
export function applyTheme(theme: ThemeDefinition, mode: 'light' | 'dark') {
  const root = document.documentElement;
  const variables = theme.cssVariables[mode];

  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

// Apply custom primary color to current theme
export function applyCustomPrimaryColor(color: string, mode: 'light' | 'dark') {
  const root = document.documentElement;
  const hslColor = hexToHsl(color);
  
  root.style.setProperty('--primary', hslColor);
  root.style.setProperty('--ring', hslColor);
  
  // Adjust primary-foreground based on lightness
  const lightness = parseInt(hslColor.split(' ')[2]);
  const foreground = lightness > 50 ? '0 0% 0%' : '0 0% 100%';
  root.style.setProperty('--primary-foreground', foreground);
}

// Get current theme from localStorage
export function getCurrentTheme(): { themeId: string; mode: 'light' | 'dark' | 'system'; customPrimary?: string } {
  if (typeof window === 'undefined') {
    return { themeId: 'default', mode: 'system' };
  }

  const stored = localStorage.getItem('crypto-app-theme-preference');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { themeId: 'default', mode: 'system' };
    }
  }

  return { themeId: 'default', mode: 'system' };
}

// Save theme preference to localStorage
export function saveThemePreference(themeId: string, mode: 'light' | 'dark' | 'system', customPrimary?: string) {
  if (typeof window === 'undefined') return;

  const preference = { themeId, mode, customPrimary };
  localStorage.setItem('crypto-app-theme-preference', JSON.stringify(preference));
}