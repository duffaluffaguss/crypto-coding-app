'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAddressExplorerUrl, getTxExplorerUrl, NETWORKS, type NetworkId } from '@/lib/networks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Deployment } from '@/types';

interface DeploymentHistoryProps {
  projectId?: string; // If provided, only show deployments for this project
  showProjectName?: boolean; // Show project name column (useful for all deployments page)
  limit?: number;
}

export function DeploymentHistory({ projectId, showProjectName = false, limit }: DeploymentHistoryProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchDeployments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchDeployments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('deployments')
        .select(`
          *,
          projects:project_id (
            name,
            project_type
          )
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching deployments:', error);
        return;
      }

      // Map the joined data
      const mappedDeployments = (data || []).map((d: any) => ({
        ...d,
        project_name: d.projects?.name,
        project_type: d.projects?.project_type,
      }));

      setDeployments(mappedDeployments);
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatGas = (gas: number | null) => {
    if (!gas) return '-';
    return gas.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNetworkBadge = (network: NetworkId) => {
    const config = NETWORKS[network];
    const isTestnet = config?.isTestnet ?? true;
    
    return (
      <Badge 
        variant={isTestnet ? 'secondary' : 'default'}
        className={isTestnet ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}
      >
        {config?.name || network}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted rounded" />
        ))}
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p>No deployments yet</p>
        <p className="text-sm mt-1">Deploy your first contract to see it here</p>
      </div>
    );
  }

  // For collapsible version in project IDE
  if (projectId && !isExpanded) {
    const latestDeployment = deployments[0];
    return (
      <div className="border-t border-border">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Deployment History</span>
            <Badge variant="secondary" className="text-xs">{deployments.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {latestDeployment && (
              <span className="text-xs text-muted-foreground">
                Last: {formatAddress(latestDeployment.contract_address)}
              </span>
            )}
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={projectId ? 'border-t border-border' : ''}>
      {/* Header for collapsible version */}
      {projectId && (
        <button
          onClick={() => setIsExpanded(false)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors border-b border-border"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Deployment History</span>
            <Badge variant="secondary" className="text-xs">{deployments.length}</Badge>
          </div>
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Deployment List */}
      <div className={`${projectId ? 'max-h-64 overflow-y-auto' : ''}`}>
        <table className="w-full text-sm">
          <thead className="bg-muted/30 sticky top-0">
            <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
              {showProjectName && <th className="px-4 py-2">Project</th>}
              <th className="px-4 py-2">Contract Address</th>
              <th className="px-4 py-2">Network</th>
              <th className="px-4 py-2">Gas Used</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deployments.map((deployment) => (
              <tr key={deployment.id} className="hover:bg-muted/30 transition-colors">
                {showProjectName && (
                  <td className="px-4 py-3">
                    <span className="font-medium">{deployment.project_name || 'Unknown'}</span>
                  </td>
                )}
                <td className="px-4 py-3">
                  <a
                    href={getAddressExplorerUrl(deployment.network, deployment.contract_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 font-mono"
                  >
                    {formatAddress(deployment.contract_address)}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
                <td className="px-4 py-3">
                  {getNetworkBadge(deployment.network)}
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {formatGas(deployment.gas_used)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(deployment.created_at)}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={getTxExplorerUrl(deployment.network, deployment.tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
