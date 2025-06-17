'use client';

import { useFeedFilters } from '@/contexts/FeedFilters';
import { cleanDomain } from '@/lib/utils';

interface UserDomainFilterBarProps {
  domains: { domain: string; count: number }[];
}

export function UserDomainFilterBar({ domains }: UserDomainFilterBarProps) {
  const { tlds, toggleTld } = useFeedFilters();

  const clearAllFilters = () => {
    Array.from(tlds).forEach(domain => toggleTld(domain));
  };

  return (
    <div className="space-y-4">
      {/* Domains */}
      <div className="mb-4">
        <h3 className="type-small">Domains</h3>
        <nav className="tld-list">
          {domains.slice(0, 10).map(({ domain, count }) => {
            const on = tlds.has(domain);
            
            return (
              <button 
                key={domain}
                className={`tld-pill${!on ? ' off' : ''}`}
                onClick={() => toggleTld(domain)}
              >
                {cleanDomain(domain)} <span className="state-inactive">({count})</span>
              </button>
            );
          })}
          
          {tlds.size > 0 && (
            <div className="pt-1">
              <button 
                onClick={clearAllFilters}
                className="w-full text-left type-small state-inactive hover:underline px-3 py-1"
              >
                clear all
              </button>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
} 