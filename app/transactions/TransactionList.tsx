'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NETWORKS, type NetworkId } from '@/lib/networks';
import { TransactionRow, TransactionDetail } from '@/components/transactions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Deployment } from '@/types';

type FilterNetwork = 'all' | NetworkId;

export function TransactionList() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [filteredDeployments, setFilteredDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [networkFilter, setNetworkFilter] = useState<FilterNetwork>('all');
  const supabase = createClient();

  useEffect(() => {
    fetchDeployments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (networkFilter === 'all') {
      setFilteredDeployments(deployments);
    } else {
      setFilteredDeployments(deployments.filter(d => d.network === networkFilter));
    }
  }, [networkFilter, deployments]);

  const fetchDeployments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deployments')
        .select(`
          *,
          projects:project_id (
            name,
            project_type
          )
        `)
        .order('created_at', { ascending: false });

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
      setFilteredDeployments(mappedDeployments);
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const expandedDeployment = expandedId 
    ? deployments.find(d => d.id === expandedId) 
    : null;

  // Get network counts for filter badges
  const networkCounts = {
    all: deployments.length,
    'base-sepolia': deployments.filter(d => d.network === 'base-sepolia').length,
    'base-mainnet': deployments.filter(d => d.network === 'base-mainnet').length,
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-lg font-medium">No transactions yet</p>
        <p className="text-sm mt-1">Deploy your first contract to see transactions here</p>
      </div>
    );
  }

  return (
    <div>
      {/* Network Filter */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-2">Filter by network:</span>
          <Button
            variant={networkFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setNetworkFilter('all')}
            className="h-8"
          >
            All
            <Badge variant="secondary" className="ml-2 text-xs">
              {networkCounts.all}
            </Badge>
          </Button>
          {Object.entries(NETWORKS).map(([id, config]) => (
            <Button
              key={id}
              variant={networkFilter === id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNetworkFilter(id as NetworkId)}
              className={`h-8 ${
                networkFilter === id 
                  ? '' 
                  : config.isTestnet 
                    ? 'text-blue-500 border-blue-500/30 hover:bg-blue-500/10' 
                    : 'text-green-500 border-green-500/30 hover:bg-green-500/10'
              }`}
            >
              {config.name}
              <Badge 
                variant="secondary" 
                className={`ml-2 text-xs ${
                  config.isTestnet ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                }`}
              >
                {networkCounts[id as NetworkId]}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 sticky top-0">
            <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3">Tx Hash</th>
              <th className="px-4 py-3">Contract</th>
              <th className="px-4 py-3">Network</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Gas Used</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Explorer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredDeployments.map((deployment) => (
              <TransactionRow
                key={deployment.id}
                deployment={deployment}
                onExpand={handleExpand}
                isExpanded={expandedId === deployment.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* No Results Message */}
      {filteredDeployments.length === 0 && deployments.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>No transactions found for {NETWORKS[networkFilter as NetworkId]?.name || 'this filter'}</p>
          <Button 
            variant="link" 
            onClick={() => setNetworkFilter('all')}
            className="mt-2"
          >
            Clear filter
          </Button>
        </div>
      )}

      {/* Expanded Detail View */}
      {expandedDeployment && (
        <div className="p-4 border-t border-border">
          <TransactionDetail 
            deployment={expandedDeployment} 
            onClose={() => setExpandedId(null)} 
          />
        </div>
      )}
    </div>
  );
}
