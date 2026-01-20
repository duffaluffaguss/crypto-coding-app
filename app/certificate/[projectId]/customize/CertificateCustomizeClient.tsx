'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CertificateDesigner } from '@/components/certificate/CertificateDesigner';
import {
  CertificateStyleConfig,
  saveCustomStyle,
  serializeStyle,
} from '@/lib/certificate-styles';
import type { CertificateData } from '@/components/certificate/Certificate';

interface CertificateCustomizeClientProps {
  certificateData: CertificateData;
  projectId: string;
  initialStyle?: CertificateStyleConfig;
}

export function CertificateCustomizeClient({
  certificateData,
  projectId,
  initialStyle,
}: CertificateCustomizeClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStyle, setCurrentStyle] = useState<CertificateStyleConfig | null>(
    initialStyle || null
  );

  const handleStyleChange = (style: CertificateStyleConfig) => {
    setCurrentStyle(style);
    setError(null);
  };

  const handleSave = async (style: CertificateStyleConfig) => {
    setIsSaving(true);
    setError(null);

    try {
      // Save to localStorage for quick access
      saveCustomStyle(projectId, style);

      // Save to database
      const response = await fetch(`/api/certificate/${projectId}/style`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ style }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save style');
      }

      // Redirect to certificate page with style param for minting
      const styleParam = serializeStyle(style);
      router.push(`/certificate/${projectId}?customStyle=saved`);
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save style');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <CertificateDesigner
        certificateData={certificateData}
        initialStyle={initialStyle}
        onStyleChange={handleStyleChange}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Info box */}
      <div className="mt-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">Your style will be saved</p>
            <p className="text-blue-300/80">
              After saving, your custom style will be used when generating the NFT image.
              The style is stored both locally and in your account for permanence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

CertificateCustomizeClient.displayName = 'CertificateCustomizeClient';
