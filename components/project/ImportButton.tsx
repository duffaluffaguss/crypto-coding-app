'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import ImportModal from './ImportModal';
import { useRouter } from 'next/navigation';

interface ImportButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function ImportButton({ 
  variant = 'outline',
  size = 'default',
  showText = true,
  className = ''
}: ImportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleSuccess = (projectId: string) => {
    router.push(`/projects/${projectId}/edit`);
    router.refresh();
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowModal(true)}
        className={className}
      >
        <Upload className="h-4 w-4" />
        {showText && <span className="ml-2">Import Project</span>}
      </Button>
      
      <ImportModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={handleSuccess}
      />
    </>
  );
}