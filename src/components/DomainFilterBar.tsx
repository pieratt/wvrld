'use client';

import { useFeedFilters } from '@/contexts/FeedFilters';
import { palette, getUser } from '@/lib/palette';
import useSWR from 'swr';
import { URLWithPost } from '@/app/api/urls/route';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DomainFilterBar() {
  const { tlds, toggleTld } = useFeedFilters();
  const { data: urls } = useSWR<URLWithPost[]>('/api/urls', fetcher);
  const { data: systemUser } = useSWR('/api/users/id/1', fetcher);
  
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

  if (!urls || !systemUser) return <div>Loading filters...</div>;

  return (
    <nav className="tld-list">
      {domains.slice(0, 10).map(({ domain, count }) => {
        const on = tlds.has(domain);
        return (
          <button
            key={domain}
            className={`tld-pill${!on ? ' off' : ''}`}
            onClick={() => toggleTld(domain)}
          >
            {domain} <span className="meta-text">({count})</span>
          </button>
        );
      })}
      
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
    </nav>
  );
} 