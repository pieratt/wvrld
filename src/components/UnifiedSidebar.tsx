'use client';

import { useFeedFilters } from '@/contexts/FeedFilters';
import useSWR from 'swr';
import { PostWithURLs } from '@/app/api/posts/route';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UnifiedSidebarProps {
  // Optional bucket filtering - if provided, only shows data for that bucket
  bucket?: string;
}

export function UnifiedSidebar({ bucket }: UnifiedSidebarProps) {
  const { tlds, toggleTld } = useFeedFilters();
  
  // Fetch data based on whether we're on a bucket page or front page
  const postsUrl = bucket ? `/api/posts?bucket=${bucket}` : '/api/posts';
  const { data: posts } = useSWR<PostWithURLs[]>(postsUrl, fetcher);
  
  // Calculate domain counts from posts data (counting unique URLs per domain)
  const domainCounts = posts?.reduce((acc, post) => {
    // Track unique URLs to avoid double counting
    const seenUrls = new Set<string>();
    post.urls.forEach(url => {
      if (url.domain && !seenUrls.has(url.url)) {
        seenUrls.add(url.url);
        acc[url.domain] = (acc[url.domain] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Further deduplicate across all posts to get truly unique URL counts per domain
  const allUniqueUrls = posts?.reduce((acc: {url: string, domain: string}[], post) => {
    post.urls.forEach(url => {
      if (url.domain && !acc.some(u => u.url === url.url)) {
        acc.push({url: url.url, domain: url.domain});
      }
    });
    return acc;
  }, []) || [];
  
  const uniqueDomainCounts = allUniqueUrls.reduce((acc, urlInfo) => {
    acc[urlInfo.domain] = (acc[urlInfo.domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const domains = Object.entries(uniqueDomainCounts)
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

  if (!posts) return <div>Loading filters...</div>;

  return (
    <div className="space-y-4">
      {/* TLDs Section */}
      <div className="filter-card">
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
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2" style={{ fontFamily: 'Inconsolata, monospace' }}>
            Editors
          </h3>
          <nav className="editors-list">
            {uniqueUsers.map((user) => (
              <a
                key={user.id}
                href={`/${user.username}`}
                className="editor-pill"
                style={{ 
                  padding: '0.25rem 0.75rem', 
                  marginBottom: '0.1rem',
                  fontSize: '14px',
                  '--user-color1': user.color1,
                  '--user-color2': user.color2
                } as React.CSSProperties}
              >
                @{user.username}
              </a>
            ))}
          </nav>
        </div>

        {/* Meta Section */}
        <div>
          <h3 className="text-sm font-medium mb-2" style={{ fontFamily: 'Inconsolata, monospace' }}>
            Meta
          </h3>
          <nav className="meta-list">
            <div className="text-sm meta-text" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}>
              {posts.length} posts
            </div>
            <div className="text-sm meta-text" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}>
              {Object.keys(uniqueDomainCounts).length} domains
            </div>
            <div className="text-sm meta-text" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}>
              {posts.reduce((sum, post) => sum + post.urls.length, 0)} URLs
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
} 