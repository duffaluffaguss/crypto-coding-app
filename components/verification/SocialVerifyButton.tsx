'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Twitter, Github, MessageCircle, Check, X, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SocialVerification {
  id: string;
  platform: 'twitter' | 'github' | 'discord';
  username: string;
  verified_at: string;
}

interface SocialVerifyButtonProps {
  platform: 'twitter' | 'github' | 'discord';
  size?: 'sm' | 'md' | 'lg';
  showUsername?: boolean;
}

const platformConfig = {
  twitter: {
    name: 'Twitter/X',
    icon: Twitter,
    color: 'bg-blue-600 hover:bg-blue-700',
    authUrl: '/api/verify/twitter',
  },
  github: {
    name: 'GitHub',
    icon: Github,
    color: 'bg-gray-900 hover:bg-gray-800',
    authUrl: '/api/verify/github',
  },
  discord: {
    name: 'Discord',
    icon: MessageCircle,
    color: 'bg-indigo-600 hover:bg-indigo-700',
    authUrl: '/api/verify/discord',
  },
};

export function SocialVerifyButton({ 
  platform, 
  size = 'md',
  showUsername = true 
}: SocialVerifyButtonProps) {
  const [verification, setVerification] = useState<SocialVerification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  
  const config = platformConfig[platform];
  const Icon = config.icon;

  // Load existing verification
  useEffect(() => {
    loadVerification();
  }, [platform]);

  const loadVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('social_verifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading verification:', error);
        return;
      }

      setVerification(data);
    } catch (error) {
      console.error('Error loading verification:', error);
    }
  };

  const handleConnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to connect your social accounts.',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      setIsVerifying(true);

      // Generate state parameter for OAuth security
      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem(`oauth_state_${platform}`, state);

      // Redirect to OAuth endpoint
      const authUrl = `${config.authUrl}?state=${state}`;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to initiate social account connection.',
        variant: 'destructive',
      });
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setIsLoading(true);

      const { error } = await supabase
        .from('social_verifications')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', platform);

      if (error) {
        throw error;
      }

      setVerification(null);
      toast({
        title: 'Account Disconnected',
        description: `Your ${config.name} account has been disconnected.`,
      });
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast({
        title: 'Disconnection Failed',
        description: 'Failed to disconnect your social account.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check for OAuth callback results
  useEffect(() => {
    const checkAuthCallback = () => {
      const params = new URLSearchParams(window.location.search);
      const success = params.get('verified');
      const error = params.get('error');
      
      if (success === 'true') {
        toast({
          title: 'Account Connected',
          description: `Your ${config.name} account has been successfully verified!`,
        });
        loadVerification();
        setIsVerifying(false);
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        toast({
          title: 'Verification Failed',
          description: error,
          variant: 'destructive',
        });
        setIsVerifying(false);
        setIsLoading(false);
      }
    };

    checkAuthCallback();
  }, []);

  if (verification) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1.5">
          <Icon className="h-3 w-3" />
          <Check className="h-3 w-3 text-green-600" />
          {showUsername && <span>@{verification.username}</span>}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          disabled={isLoading}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default';
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <Button
      onClick={handleConnect}
      disabled={isLoading || isVerifying}
      size={buttonSize}
      className={`${config.color} text-white`}
    >
      <Icon className={iconSize} />
      {isVerifying ? 'Verifying...' : `Connect ${config.name}`}
      {isVerifying && <ExternalLink className="ml-1 h-3 w-3" />}
    </Button>
  );
}

export function SocialVerificationList({ userId }: { userId: string }) {
  const [verifications, setVerifications] = useState<SocialVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadVerifications();
  }, [userId]);

  const loadVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('social_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('verified_at', { ascending: false });

      if (error) {
        console.error('Error loading verifications:', error);
        return;
      }

      setVerifications(data || []);
    } catch (error) {
      console.error('Error loading verifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading verifications...</div>;
  }

  if (verifications.length === 0) {
    return <div className="text-sm text-muted-foreground">No verified accounts</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {verifications.map((verification) => {
        const config = platformConfig[verification.platform];
        const Icon = config.icon;
        
        return (
          <Badge key={verification.id} variant="secondary" className="flex items-center gap-1.5">
            <Icon className="h-3 w-3" />
            <Check className="h-3 w-3 text-green-600" />
            <span>@{verification.username}</span>
          </Badge>
        );
      })}
    </div>
  );
}