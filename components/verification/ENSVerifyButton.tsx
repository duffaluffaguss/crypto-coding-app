'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Check, X, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAccount, useSignMessage } from 'wagmi';
import { getEnsName, getEnsAvatar } from '@/lib/ens';

interface EnsVerification {
  id: string;
  name: string;
  verified_at: string;
  avatar?: string;
}

interface ENSVerifyButtonProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function ENSVerifyButton({ 
  size = 'md',
  showName = true 
}: ENSVerifyButtonProps) {
  const [verification, setVerification] = useState<EnsVerification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [ensAvatar, setEnsAvatar] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { toast } = useToast();
  const supabase = createClient();

  const buttonSizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg',
  };

  useEffect(() => {
    if (isConnected && address) {
      checkExistingVerification();
      lookupEnsName();
    }
  }, [address, isConnected]);

  const checkExistingVerification = async () => {
    if (!address) return;
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from('ens_names')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('is_primary', true)
        .single();

      if (data) {
        setVerification(data);
      }
    } catch (error) {
      console.error('Error checking ENS verification:', error);
    }
  };

  const lookupEnsName = async () => {
    if (!address) return;
    
    try {
      const name = await getEnsName(address);
      setEnsName(name);
      
      if (name) {
        const avatar = await getEnsAvatar(name);
        setEnsAvatar(avatar);
      }
    } catch (error) {
      console.error('Error looking up ENS name:', error);
    }
  };

  const handleVerify = async () => {
    if (!isConnected || !address || !ensName) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet and ensure you have an ENS name.',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Create a verification message
      const message = `I am verifying ownership of ENS name ${ensName} for address ${address} at ${new Date().toISOString()}`;
      
      // Sign the message
      const signature = await signMessageAsync({ message });

      // Send verification request to API
      const response = await fetch('/api/verify/ens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          ensName,
          message,
          signature,
          avatar: ensAvatar,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
      }

      const result = await response.json();
      
      setVerification({
        id: result.id,
        name: ensName,
        verified_at: result.verified_at,
        avatar: ensAvatar || undefined,
      });

      toast({
        title: 'ENS Verified!',
        description: `Successfully verified ${ensName}`,
      });

    } catch (error: any) {
      console.error('ENS verification error:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Failed to verify ENS name',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnverify = async () => {
    if (!verification) return;
    
    setIsLoading(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('ens_names')
        .delete()
        .eq('id', verification.id)
        .eq('user_id', user.user.id);

      if (error) throw error;

      setVerification(null);
      toast({
        title: 'ENS Unverified',
        description: 'ENS name verification removed',
      });

    } catch (error: any) {
      console.error('Error removing ENS verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove ENS verification',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Button 
        variant="outline" 
        className={buttonSizes[size]}
        disabled
      >
        Connect Wallet First
      </Button>
    );
  }

  if (!ensName) {
    return (
      <Button 
        variant="outline" 
        className={buttonSizes[size]}
        disabled
      >
        No ENS Name Found
      </Button>
    );
  }

  if (verification) {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant="secondary" 
          className="bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
        >
          <Check className="w-3 h-3 mr-1" />
          {showName ? verification.name : 'ENS Verified'}
        </Badge>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUnverify}
          disabled={isLoading}
          className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <X className="w-3 h-3" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`https://etherscan.io/enslookup-search?search=${verification.name}`, '_blank')}
          className="h-6 w-6 p-0 text-gray-500 hover:text-blue-500"
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleVerify}
      disabled={isVerifying}
      className={`${buttonSizes[size]} bg-blue-600 hover:bg-blue-700 text-white`}
    >
      {isVerifying ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Verifying...
        </>
      ) : (
        <>
          ◆ Verify {ensName}
        </>
      )}
    </Button>
  );
}