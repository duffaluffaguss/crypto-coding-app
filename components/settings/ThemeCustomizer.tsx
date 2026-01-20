'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  presetThemes, 
  applyTheme, 
  applyCustomPrimaryColor, 
  getCurrentTheme, 
  saveThemePreference,
  type ThemeDefinition 
} from '@/lib/themes';
import { cn } from '@/lib/utils';

export function ThemeCustomizer() {
  const { theme: systemTheme, setTheme: setSystemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('default');
  const [currentMode, setCurrentMode] = useState<'light' | 'dark' | 'system'>('system');
  const [customPrimaryColor, setCustomPrimaryColor] = useState('#3B82F6');
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');

  // Load saved theme preference on mount
  useEffect(() => {
    setMounted(true);
    const { themeId, mode, customPrimary } = getCurrentTheme();
    setSelectedPreset(themeId);
    setCurrentMode(mode);
    if (customPrimary) {
      setCustomPrimaryColor(customPrimary);
    }
  }, []);

  // Apply theme changes immediately for preview
  useEffect(() => {
    if (!mounted) return;

    const theme = presetThemes.find(t => t.id === selectedPreset);
    if (!theme) return;

    const resolvedMode = currentMode === 'system' 
      ? (systemTheme === 'dark' ? 'dark' : 'light')
      : currentMode;

    // Apply preset theme
    applyTheme(theme, resolvedMode);
    
    // Apply custom primary color if different from preset
    if (customPrimaryColor !== theme.colors.primary) {
      applyCustomPrimaryColor(customPrimaryColor, resolvedMode);
    }

    // Update system theme
    setSystemTheme(currentMode);

    // Save preferences
    saveThemePreference(selectedPreset, currentMode, customPrimaryColor);
  }, [selectedPreset, currentMode, customPrimaryColor, mounted, systemTheme, setSystemTheme]);

  const handlePresetChange = (themeId: string) => {
    const theme = presetThemes.find(t => t.id === themeId);
    if (theme) {
      setSelectedPreset(themeId);
      setCustomPrimaryColor(theme.colors.primary);
    }
  };

  const handleModeChange = (mode: 'light' | 'dark' | 'system') => {
    setCurrentMode(mode);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomPrimaryColor(color);
  };

  const getCurrentThemeForPreview = (): ThemeDefinition => {
    return presetThemes.find(t => t.id === selectedPreset) || presetThemes[0];
  };

  if (!mounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-32" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded" />
          ))}
        </div>
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Theme Mode</Label>
        <div className="flex gap-1">
          <Button
            variant={currentMode === 'light' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('light')}
            className="flex-1"
          >
            ☀️ Light
          </Button>
          <Button
            variant={currentMode === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('dark')}
            className="flex-1"
          >
            🌙 Dark
          </Button>
          <Button
            variant={currentMode === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('system')}
            className="flex-1"
          >
            💻 System
          </Button>
        </div>
      </div>

      {/* Preset Themes */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Preset Themes</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {presetThemes.map((theme) => (
            <Card
              key={theme.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:scale-105",
                selectedPreset === theme.id
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "hover:border-primary/50"
              )}
              onClick={() => handlePresetChange(theme.id)}
            >
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg" role="img" aria-label={theme.name}>
                      {theme.emoji}
                    </span>
                    {selectedPreset === theme.id && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{theme.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {theme.description}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {Object.values(theme.colors).map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-sm border border-border/50"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Primary Color */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Custom Primary Color</Label>
        <div className="flex items-center gap-3">
          <Input
            type="color"
            value={customPrimaryColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="w-16 h-10 rounded cursor-pointer"
          />
          <Input
            type="text"
            value={customPrimaryColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            placeholder="#3B82F6"
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const theme = getCurrentThemeForPreview();
              setCustomPrimaryColor(theme.colors.primary);
            }}
          >
            Reset
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Pick a color to customize the primary theme color, or use the color code input for precise control.
        </p>
      </div>

      {/* Preview Panel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="flex gap-1">
            <Button
              variant={previewMode === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('light')}
            >
              Light
            </Button>
            <Button
              variant={previewMode === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('dark')}
            >
              Dark
            </Button>
          </div>
        </div>
        
        <PreviewPanel
          theme={getCurrentThemeForPreview()}
          mode={previewMode}
          customPrimary={customPrimaryColor}
        />
      </div>

      {/* Current Theme Info */}
      <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
        <div className="space-y-1">
          <p>
            <span className="font-medium">Current:</span>{' '}
            {getCurrentThemeForPreview().name} theme in {currentMode} mode
          </p>
          <p>
            <span className="font-medium">Primary Color:</span>{' '}
            <span className="font-mono">{customPrimaryColor}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Preview Panel Component
interface PreviewPanelProps {
  theme: ThemeDefinition;
  mode: 'light' | 'dark';
  customPrimary: string;
}

function PreviewPanel({ theme, mode, customPrimary }: PreviewPanelProps) {
  const variables = theme.cssVariables[mode];
  
  // Create CSS string for preview
  const previewStyles = Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');

  const isPrimaryCustomized = customPrimary !== theme.colors.primary;

  return (
    <Card 
      className="p-4 border-2"
      style={{
        color: `hsl(${variables['--foreground']})`,
        backgroundColor: `hsl(${variables['--background']})`,
        borderColor: `hsl(${variables['--border']})`,
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold">Preview Components</h4>
          <p className="text-sm" style={{ color: `hsl(${variables['--muted-foreground']})` }}>
            See how your theme looks across different elements.
          </p>
        </div>

        <div className="space-y-3">
          {/* Primary Button */}
          <div
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium"
            style={{
              backgroundColor: isPrimaryCustomized 
                ? customPrimary 
                : `hsl(${variables['--primary']})`,
              color: `hsl(${variables['--primary-foreground']})`,
            }}
          >
            Primary Button
          </div>

          {/* Secondary Button */}
          <div
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border ml-2"
            style={{
              backgroundColor: `hsl(${variables['--secondary']})`,
              color: `hsl(${variables['--secondary-foreground']})`,
              borderColor: `hsl(${variables['--border']})`,
            }}
          >
            Secondary Button
          </div>

          {/* Card */}
          <div
            className="p-3 rounded-lg border"
            style={{
              backgroundColor: `hsl(${variables['--card']})`,
              color: `hsl(${variables['--card-foreground']})`,
              borderColor: `hsl(${variables['--border']})`,
            }}
          >
            <h5 className="font-medium mb-1">Card Title</h5>
            <p className="text-sm" style={{ color: `hsl(${variables['--muted-foreground']})` }}>
              This is how cards will look with your selected theme.
            </p>
          </div>

          {/* Muted Section */}
          <div
            className="p-3 rounded-lg"
            style={{
              backgroundColor: `hsl(${variables['--muted']})`,
              color: `hsl(${variables['--muted-foreground']})`,
            }}
          >
            <p className="text-sm">Muted background section</p>
          </div>
        </div>
      </div>
    </Card>
  );
}