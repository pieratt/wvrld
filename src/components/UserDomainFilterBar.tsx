'use client';

import { useFeedFilters } from '@/contexts/FeedFilters';
import { URLWithPost } from '@/app/api/urls/route';

interface UserDomainFilterBarProps {
  urls: URLWithPost[] | undefined;
}

export function UserDomainFilterBar({ urls }: UserDomainFilterBarProps) {
  const { tlds, toggleTld } = useFeedFilters();
  
  // Calculate domain counts from user's data
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

  if (!urls || domains.length === 0) return null;

  return (
    <div className="filter-card">
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
    </div>
  );
} 