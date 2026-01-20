'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  CertificateStyleConfig,
  BackgroundStyle,
  BorderStyle,
  ElementVisibility,
  BACKGROUND_PRESETS,
  BORDER_PRESETS,
  ACCENT_COLORS,
  STYLE_PRESETS,
  DEFAULT_ELEMENTS,
  getDefaultStyle,
  generateGradientCSS,
} from '@/lib/certificate-styles';
import type { CertificateData } from './Certificate';

interface CertificateDesignerProps {
  certificateData: CertificateData;
  initialStyle?: CertificateStyleConfig;
  onStyleChange?: (style: CertificateStyleConfig) => void;
  onSave?: (style: CertificateStyleConfig) => void;
  isSaving?: boolean;
}

// Preview component that reflects current style
function StyledCertificatePreview({
  data,
  style,
}: {
  data: CertificateData;
  style: CertificateStyleConfig;
}) {
  const accentColor = style.accentColor;
  const bgGradient = generateGradientCSS(style.background);
  const { elements } = style;

  const borderStyle = useMemo(() => {
    switch (style.border.type) {
      case 'gradient':
        return {
          border: `${style.border.width}px solid transparent`,
          backgroundImage: `linear-gradient(${bgGradient}, ${bgGradient}), linear-gradient(145deg, ${accentColor}, ${accentColor}88)`,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        };
      case 'solid':
        return {
          border: `${style.border.width}px solid ${style.border.color || accentColor}`,
        };
      case 'double':
        return {
          border: `${style.border.width}px double ${style.border.color || accentColor}`,
        };
      default:
        return {};
    }
  }, [style.border, accentColor, bgGradient]);

  return (
    <div
      className="relative w-full aspect-square rounded-3xl overflow-hidden"
      style={{
        background: bgGradient,
        borderRadius: `${style.border.radius}px`,
        ...borderStyle,
      }}
    >
      {/* Corner Accents */}
      {elements.showCornerAccents && (
        <>
          <div
            className="absolute top-3 left-3 w-8 h-8"
            style={{
              borderTop: `3px solid ${accentColor}`,
              borderLeft: `3px solid ${accentColor}`,
              borderRadius: '4px 0 0 0',
            }}
          />
          <div
            className="absolute top-3 right-3 w-8 h-8"
            style={{
              borderTop: `3px solid ${accentColor}`,
              borderRight: `3px solid ${accentColor}`,
              borderRadius: '0 4px 0 0',
            }}
          />
          <div
            className="absolute bottom-3 left-3 w-8 h-8"
            style={{
              borderBottom: `3px solid ${accentColor}`,
              borderLeft: `3px solid ${accentColor}`,
              borderRadius: '0 0 0 4px',
            }}
          />
          <div
            className="absolute bottom-3 right-3 w-8 h-8"
            style={{
              borderBottom: `3px solid ${accentColor}`,
              borderRight: `3px solid ${accentColor}`,
              borderRadius: '0 0 4px 0',
            }}
          />
        </>
      )}

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col items-center justify-between text-center">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)` }}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
          <h3
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: accentColor }}
          >
            Certificate of Completion
          </h3>
        </div>

        {/* Center content */}
        <div className="space-y-2 flex-1 flex flex-col items-center justify-center">
          <div className="text-3xl">🏆</div>
          <h2
            className="text-lg font-bold"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {data.userName}
          </h2>

          <div>
            <h4 className="text-sm font-semibold text-white">{data.projectName}</h4>
            {elements.showBadge && (
              <span
                className="inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full"
                style={{
                  background: `${accentColor}22`,
                  color: accentColor,
                  border: `1px solid ${accentColor}33`,
                }}
              >
                {data.projectType.replace('_', ' ')}
              </span>
            )}
          </div>

          {elements.showNetwork && data.contractAddress && (
            <div className="flex items-center gap-1 text-[10px] text-green-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Deployed on Base</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="space-y-1">
          {elements.showDate && (
            <p className="text-[10px] text-zinc-400">{data.completionDate}</p>
          )}
          {elements.showCertificateId && (
            <p className="text-[8px] text-zinc-500 font-mono">{data.certificateId}</p>
          )}
          {elements.showContractAddress && data.contractAddress && (
            <p className="text-[8px] text-zinc-600 font-mono">
              {data.contractAddress.slice(0, 6)}...{data.contractAddress.slice(-4)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CertificateDesigner({
  certificateData,
  initialStyle,
  onStyleChange,
  onSave,
  isSaving = false,
}: CertificateDesignerProps) {
  const [style, setStyle] = useState<CertificateStyleConfig>(
    initialStyle || getDefaultStyle()
  );

  const updateStyle = useCallback(
    (updates: Partial<CertificateStyleConfig>) => {
      setStyle((prev) => {
        const newStyle = { ...prev, ...updates };
        onStyleChange?.(newStyle);
        return newStyle;
      });
    },
    [onStyleChange]
  );

  const updateBackground = useCallback(
    (bg: BackgroundStyle) => {
      updateStyle({ background: bg });
    },
    [updateStyle]
  );

  const updateBorder = useCallback(
    (border: BorderStyle) => {
      updateStyle({ border });
    },
    [updateStyle]
  );

  const updateElements = useCallback(
    (key: keyof ElementVisibility, value: boolean) => {
      updateStyle({
        elements: { ...style.elements, [key]: value },
      });
    },
    [updateStyle, style.elements]
  );

  const applyPreset = useCallback(
    (preset: CertificateStyleConfig) => {
      setStyle(preset);
      onStyleChange?.(preset);
    },
    [onStyleChange]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Preview Panel */}
      <div className="order-1 lg:order-2">
        <div className="sticky top-24">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Live Preview</h3>
          <div className="max-w-xs mx-auto lg:mx-0">
            <StyledCertificatePreview data={certificateData} style={style} />
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center lg:text-left">
            This preview shows how your NFT certificate will look
          </p>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="order-2 lg:order-1 space-y-6">
        {/* Theme Presets */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Themes</Label>
          <div className="grid grid-cols-3 gap-2">
            {STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  'border hover:border-primary/50',
                  style.id === preset.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                )}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Background Color */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Background</Label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(BACKGROUND_PRESETS).map(([key, bg]) => (
              <button
                key={key}
                onClick={() => updateBackground(bg)}
                className={cn(
                  'h-12 rounded-lg border-2 transition-all',
                  JSON.stringify(style.background) === JSON.stringify(bg)
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/50'
                )}
                style={{ background: generateGradientCSS(bg) }}
              >
                <span className="sr-only">{key}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Accent Color</Label>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => updateStyle({ accentColor: color.color })}
                className={cn(
                  'w-10 h-10 rounded-full border-2 transition-all',
                  style.accentColor === color.color
                    ? 'border-white ring-2 ring-white/30 scale-110'
                    : 'border-transparent hover:scale-105'
                )}
                style={{ background: `linear-gradient(135deg, ${color.color}, ${color.secondary})` }}
                title={color.name}
              >
                <span className="sr-only">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Border Style */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Border Style</Label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(BORDER_PRESETS).map(([key, border]) => (
              <button
                key={key}
                onClick={() => updateBorder({ ...border, color: style.accentColor })}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize',
                  'border hover:border-primary/50',
                  style.border.type === border.type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                )}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Element Toggles */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Show/Hide Elements</Label>
          <div className="space-y-3 bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-date" className="text-sm text-muted-foreground cursor-pointer">
                Completion Date
              </Label>
              <Switch
                id="show-date"
                checked={style.elements.showDate}
                onCheckedChange={(checked) => updateElements('showDate', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-badge" className="text-sm text-muted-foreground cursor-pointer">
                Project Type Badge
              </Label>
              <Switch
                id="show-badge"
                checked={style.elements.showBadge}
                onCheckedChange={(checked) => updateElements('showBadge', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-corners" className="text-sm text-muted-foreground cursor-pointer">
                Corner Accents
              </Label>
              <Switch
                id="show-corners"
                checked={style.elements.showCornerAccents}
                onCheckedChange={(checked) => updateElements('showCornerAccents', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-id" className="text-sm text-muted-foreground cursor-pointer">
                Certificate ID
              </Label>
              <Switch
                id="show-id"
                checked={style.elements.showCertificateId}
                onCheckedChange={(checked) => updateElements('showCertificateId', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-network" className="text-sm text-muted-foreground cursor-pointer">
                Network Badge
              </Label>
              <Switch
                id="show-network"
                checked={style.elements.showNetwork}
                onCheckedChange={(checked) => updateElements('showNetwork', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-contract" className="text-sm text-muted-foreground cursor-pointer">
                Contract Address
              </Label>
              <Switch
                id="show-contract"
                checked={style.elements.showContractAddress}
                onCheckedChange={(checked) => updateElements('showContractAddress', checked)}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        {onSave && (
          <div className="pt-4">
            <Button
              onClick={() => onSave(style)}
              disabled={isSaving}
              className="w-full"
              size="lg"
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save & Mint NFT
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

CertificateDesigner.displayName = 'CertificateDesigner';
