// Certificate Style Configuration Types and Presets

export interface CertificateStyleConfig {
  id: string;
  name: string;
  background: BackgroundStyle;
  border: BorderStyle;
  accentColor: string;
  elements: ElementVisibility;
}

export interface BackgroundStyle {
  type: 'solid' | 'gradient';
  color?: string;
  gradient?: {
    from: string;
    via?: string;
    to: string;
    direction: 'to-br' | 'to-r' | 'to-b' | 'to-tr';
  };
}

export interface BorderStyle {
  type: 'gradient' | 'solid' | 'double' | 'none';
  color?: string;
  width: number;
  radius: number;
}

export interface ElementVisibility {
  showDate: boolean;
  showBadge: boolean;
  showContractAddress: boolean;
  showNetwork: boolean;
  showCornerAccents: boolean;
  showCertificateId: boolean;
}

// Background Presets
export const BACKGROUND_PRESETS: Record<string, BackgroundStyle> = {
  midnight: {
    type: 'gradient',
    gradient: {
      from: '#0a0a1a',
      via: '#1a1a3e',
      to: '#2d1b4e',
      direction: 'to-br',
    },
  },
  ocean: {
    type: 'gradient',
    gradient: {
      from: '#0c1929',
      via: '#0d3b66',
      to: '#1a5f7a',
      direction: 'to-br',
    },
  },
  sunset: {
    type: 'gradient',
    gradient: {
      from: '#1a0a1e',
      via: '#4a1942',
      to: '#6b2d5b',
      direction: 'to-br',
    },
  },
  forest: {
    type: 'gradient',
    gradient: {
      from: '#0a1a14',
      via: '#1a3a2a',
      to: '#2d4a3a',
      direction: 'to-br',
    },
  },
  gold: {
    type: 'gradient',
    gradient: {
      from: '#1a150a',
      via: '#3d2e1a',
      to: '#5a4520',
      direction: 'to-br',
    },
  },
  slate: {
    type: 'gradient',
    gradient: {
      from: '#0f172a',
      via: '#1e293b',
      to: '#334155',
      direction: 'to-br',
    },
  },
};

// Border Style Presets
export const BORDER_PRESETS: Record<string, BorderStyle> = {
  gradient: {
    type: 'gradient',
    color: undefined,
    width: 3,
    radius: 24,
  },
  solid: {
    type: 'solid',
    color: '#8B5CF6',
    width: 3,
    radius: 24,
  },
  double: {
    type: 'double',
    color: '#8B5CF6',
    width: 4,
    radius: 24,
  },
  none: {
    type: 'none',
    color: undefined,
    width: 0,
    radius: 24,
  },
};

// Accent Color Presets
export const ACCENT_COLORS = [
  { id: 'purple', name: 'Purple', color: '#8B5CF6', secondary: '#C4B5FD' },
  { id: 'blue', name: 'Blue', color: '#3B82F6', secondary: '#93C5FD' },
  { id: 'cyan', name: 'Cyan', color: '#06B6D4', secondary: '#67E8F9' },
  { id: 'green', name: 'Green', color: '#22C55E', secondary: '#86EFAC' },
  { id: 'amber', name: 'Gold', color: '#F59E0B', secondary: '#FCD34D' },
  { id: 'pink', name: 'Pink', color: '#EC4899', secondary: '#F9A8D4' },
  { id: 'red', name: 'Red', color: '#EF4444', secondary: '#FCA5A5' },
  { id: 'orange', name: 'Orange', color: '#F97316', secondary: '#FDBA74' },
];

// Default Element Visibility
export const DEFAULT_ELEMENTS: ElementVisibility = {
  showDate: true,
  showBadge: true,
  showContractAddress: true,
  showNetwork: true,
  showCornerAccents: true,
  showCertificateId: true,
};

// Complete Style Presets (Themes)
export const STYLE_PRESETS: CertificateStyleConfig[] = [
  {
    id: 'classic',
    name: 'Classic',
    background: BACKGROUND_PRESETS.midnight,
    border: BORDER_PRESETS.gradient,
    accentColor: '#8B5CF6',
    elements: DEFAULT_ELEMENTS,
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    background: BACKGROUND_PRESETS.ocean,
    border: BORDER_PRESETS.solid,
    accentColor: '#06B6D4',
    elements: DEFAULT_ELEMENTS,
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    background: BACKGROUND_PRESETS.gold,
    border: BORDER_PRESETS.double,
    accentColor: '#F59E0B',
    elements: DEFAULT_ELEMENTS,
  },
  {
    id: 'forest-sage',
    name: 'Forest Sage',
    background: BACKGROUND_PRESETS.forest,
    border: BORDER_PRESETS.solid,
    accentColor: '#22C55E',
    elements: DEFAULT_ELEMENTS,
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    background: BACKGROUND_PRESETS.sunset,
    border: BORDER_PRESETS.gradient,
    accentColor: '#EC4899',
    elements: DEFAULT_ELEMENTS,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    background: BACKGROUND_PRESETS.slate,
    border: BORDER_PRESETS.none,
    accentColor: '#3B82F6',
    elements: {
      ...DEFAULT_ELEMENTS,
      showCornerAccents: false,
      showBadge: false,
    },
  },
];

// Helper to get style by ID
export function getStylePreset(id: string): CertificateStyleConfig | undefined {
  return STYLE_PRESETS.find((preset) => preset.id === id);
}

// Helper to get default style
export function getDefaultStyle(): CertificateStyleConfig {
  return STYLE_PRESETS[0];
}

// Helper to get accent color details
export function getAccentColorDetails(color: string) {
  return ACCENT_COLORS.find((c) => c.color === color) || ACCENT_COLORS[0];
}

// Generate CSS gradient string from BackgroundStyle
export function generateGradientCSS(bg: BackgroundStyle): string {
  if (bg.type === 'solid') {
    return bg.color || '#0a0a1a';
  }
  
  if (bg.gradient) {
    const { from, via, to, direction } = bg.gradient;
    const directionMap: Record<string, string> = {
      'to-br': '145deg',
      'to-r': '90deg',
      'to-b': '180deg',
      'to-tr': '45deg',
    };
    const angle = directionMap[direction] || '145deg';
    
    if (via) {
      return `linear-gradient(${angle}, ${from} 0%, ${via} 50%, ${to} 100%)`;
    }
    return `linear-gradient(${angle}, ${from} 0%, ${to} 100%)`;
  }
  
  return '#0a0a1a';
}

// Generate Tailwind gradient classes from BackgroundStyle
export function generateTailwindGradient(bg: BackgroundStyle): string {
  if (bg.type === 'solid') {
    return `bg-[${bg.color || '#0a0a1a'}]`;
  }
  
  // For Tailwind we use arbitrary values
  if (bg.gradient) {
    return `bg-gradient-${bg.gradient.direction}`;
  }
  
  return 'bg-zinc-900';
}

// Storage key for custom styles
export const CERTIFICATE_STYLE_STORAGE_KEY = 'certificate_custom_style';

// Save custom style to localStorage
export function saveCustomStyle(projectId: string, style: CertificateStyleConfig): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(CERTIFICATE_STYLE_STORAGE_KEY);
    const styles = stored ? JSON.parse(stored) : {};
    styles[projectId] = style;
    localStorage.setItem(CERTIFICATE_STYLE_STORAGE_KEY, JSON.stringify(styles));
  } catch (error) {
    console.error('Failed to save certificate style:', error);
  }
}

// Load custom style from localStorage
export function loadCustomStyle(projectId: string): CertificateStyleConfig | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(CERTIFICATE_STYLE_STORAGE_KEY);
    if (!stored) return null;
    
    const styles = JSON.parse(stored);
    return styles[projectId] || null;
  } catch (error) {
    console.error('Failed to load certificate style:', error);
    return null;
  }
}

// Serialize style config to URL-safe string
export function serializeStyle(style: CertificateStyleConfig): string {
  return encodeURIComponent(JSON.stringify(style));
}

// Deserialize style config from URL-safe string
export function deserializeStyle(encoded: string): CertificateStyleConfig | null {
  try {
    return JSON.parse(decodeURIComponent(encoded));
  } catch {
    return null;
  }
}
