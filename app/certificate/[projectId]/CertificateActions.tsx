'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Certificate, type CertificateData } from '@/components/certificate';

interface CertificateActionsProps {
  certificateData: CertificateData;
}

export function CertificateActions({ certificateData }: CertificateActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Use html2canvas to capture the certificate
      const html2canvas = (await import('html2canvas')).default;
      
      // Create a temporary container for the certificate
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '800px';
      document.body.appendChild(tempContainer);

      // Render certificate into temp container
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempContainer);
      
      await new Promise<void>((resolve) => {
        root.render(
          <div className="bg-white p-4">
            <Certificate data={certificateData} />
          </div>
        );
        // Wait for render
        setTimeout(resolve, 500);
      });

      // Capture the certificate
      const canvas = await html2canvas(tempContainer, {
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 900,
        windowHeight: 700,
      } as any);

      // Clean up
      root.unmount();
      document.body.removeChild(tempContainer);

      // Download the image
      const link = document.createElement('a');
      link.download = `certificate-${certificateData.projectName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to download certificate:', error);
      // Fallback: just print
      handlePrint();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {/* Download Button */}
      <Button
        onClick={handleDownload}
        disabled={downloading}
        className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
      >
        {downloading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Certificate
          </>
        )}
      </Button>

      {/* Print Button */}
      <Button onClick={handlePrint} variant="outline" className="gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        Print
      </Button>
    </div>
  );
}
