'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  projectId: string;
  projectName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function ExportButton({ 
  projectId, 
  projectName, 
  variant = 'outline',
  size = 'default',
  showText = true,
  className = ''
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      
      const response = await fetch(`/api/projects/export?projectId=${encodeURIComponent(projectId)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export project');
      }

      // Get the filename from Content-Disposition header or create a default one
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `${projectName.replace(/\s+/g, '-').toLowerCase()}-export.zip`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Show success message
      toast.success(`Successfully exported "${projectName}"`, {
        description: `Downloaded as ${filename}`,
      });
      
    } catch (error) {
      console.error('Error exporting project:', error);
      toast.error('Failed to export project', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {showText && (
        <span className="ml-2">
          {isExporting ? 'Exporting...' : 'Export ZIP'}
        </span>
      )}
    </Button>
  );
}