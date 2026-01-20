import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getEnsName } from '@/lib/ens';

interface UseENSReturn {
  ensName: string | null;
  ensAvatar: string | null;
  isLoading: boolean;
  displayName: string; // ENS name or truncated address
}

export function useENS(address?: string): UseENSReturn {
  const { address: connectedAddress } = useAccount();
  const [ensName, setEnsName] = useState<string | null>(null);
  const [ensAvatar, setEnsAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const targetAddress = address || connectedAddress;
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!targetAddress) {
      setEnsName(null);
      setEnsAvatar(null);
      return;
    }

    const loadENSData = async () => {
      setIsLoading(true);
      
      try {
        // First, check if we have a verified ENS name in our database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: ensData } = await supabase
            .from('ens_names')
            .select('name, avatar')
            .eq('user_id', user.id)
            .eq('address', targetAddress.toLowerCase())
            .eq('is_primary', true)
            .single();
          
          if (ensData) {
            setEnsName(ensData.name);
            setEnsAvatar(ensData.avatar);
            return;
          }
        }

        // If not in database, look it up on-chain
        const onChainEnsName = await getEnsName(targetAddress);
        if (onChainEnsName) {
          setEnsName(onChainEnsName);
          // Note: Not fetching avatar for unverified ENS names to avoid rate limits
        }
        
      } catch (error) {
        console.error('Error loading ENS data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadENSData();
  }, [targetAddress, supabase]);

  const displayName = ensName || (targetAddress ? `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}` : '');

  return {
    ensName,
    ensAvatar,
    isLoading,
    displayName,
  };
}