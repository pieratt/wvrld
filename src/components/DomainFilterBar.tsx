'use client';

import { useFeedFilters } from '@/contexts/FeedFilters';
import { palette } from '@/lib/palette';
import useSWR from 'swr';
import { URLWithPost } from '@/app/api/urls/route';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DomainFilterBar() {
  const { tlds, toggleTld } = useFeedFilters();
  const { data: urls } = useSWR<URLWithPost[]>('/api/urls', fetcher);
  
  // Calculate domain counts from actual data
  const domainCounts = urls?.reduce((acc, url) => {
    if (url.domain) {
      acc[url.domain] = (acc[url.domain] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  const domains = Object.entries(domainCounts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);

  const clearAllFilters = () => {
    Array.from(tlds).forEach(domain => toggleTld(domain));
  };

  // Get system colors for filter pills
  const colors = palette({
    cardOwner: { id: 1, username: 'system', title: 'System', color1: '#eeeeee', color2: '#111111', type: 'system' },
    isFront: true,
    pageOwner: undefined
  });

  if (!urls) return <div>Loading filters...</div>;

  return (
    <div className="space-y-0">
      {domains.slice(0, 10).map(({ domain, count }) => (
        <div
          key={domain}
          className={`w-full ${count === 0 ? 'opacity-15 pointer-events-none' : tlds.has(domain) ? 'opacity-100' : 'opacity-30'}`}
        >
          <button
            onClick={() => toggleTld(domain)}
            className="w-full text-left px-3 py-2 rounded-full"
            style={{ 
              backgroundColor: colors.pillBg, 
              color: colors.pillFont 
            }}
          >
            {domain} ({count})
          </button>
        </div>
      ))}
      
      {tlds.size > 0 && (
        <div className="pt-2">
          <button 
            onClick={clearAllFilters}
            className="w-full text-left meta-text hover:underline px-3 py-1"
          >
            clear all
          </button>
        </div>
      )}
    </div>
  );
} 