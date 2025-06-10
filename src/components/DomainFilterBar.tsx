'use client';

import { useFeedFilters } from '@/contexts/FeedFilters';
import { palette, getUser } from '@/lib/palette';
import useSWR from 'swr';
import { URLWithPost } from '@/app/api/urls/route';
import { PostWithURLs } from '@/app/api/posts/route';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DomainFilterBar() {
  const { tlds, toggleTld } = useFeedFilters();
  const { data: urls } = useSWR<URLWithPost[]>('/api/urls', fetcher);
  const { data: systemUser } = useSWR('/api/users/id/1', fetcher);
  const { data: posts } = useSWR<PostWithURLs[]>('/api/posts', fetcher);
  
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

  // Get unique users from posts for the Editors section
  type UserType = {id: number, username: string, title: string | null, color1: string, color2: string};
  const uniqueUsers = posts?.reduce((acc: UserType[], post: PostWithURLs) => {
    const userId = post.owner.id;
    if (!acc.some((user: UserType) => user.id === userId)) {
      acc.push(post.owner);
    }
    return acc;
  }, [] as UserType[]) || [];

  const clearAllFilters = () => {
    Array.from(tlds).forEach(domain => toggleTld(domain));
  };

  if (!urls || !systemUser) return <div>Loading filters...</div>;

  return (
    <div className="filter-card">
      {/* TLDs Section */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2" style={{ fontFamily: 'Inconsolata, monospace' }}>
          TLDs
        </h3>
        <nav className="tld-list">
          {domains.slice(0, 10).map(({ domain, count }) => {
            const on = tlds.has(domain);
            return (
              <button
                key={domain}
                className={`tld-pill${!on ? ' off' : ''}`}
                style={{ padding: '0.25rem 0.75rem', marginBottom: '0.1rem' }}
                onClick={() => toggleTld(domain)}
              >
                {domain} <span className="meta-text">{count}</span>
              </button>
            );
          })}
          
          {tlds.size > 0 && (
            <div className="pt-1">
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

      {/* Editors Section */}
      <div>
        <h3 className="text-sm font-medium mb-2" style={{ fontFamily: 'Inconsolata, monospace' }}>
          Editors
        </h3>
        <nav className="editors-list">
          {uniqueUsers.map((user) => (
            <a
              key={user.id}
              href={`/${user.username}`}
              className="block hover:underline"
              style={{ 
                padding: '0.25rem 0.75rem', 
                marginBottom: '0.1rem',
                color: user.color1,
                fontSize: '14px'
              }}
            >
              @{user.username}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
} 