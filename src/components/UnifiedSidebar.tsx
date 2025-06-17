'use client';

import { useFeedFilters } from '@/contexts/FeedFilters';
import useSWR from 'swr';
import { PostWithURLs } from '@/app/api/posts/route';
import Link from 'next/link';
import { cleanDomain } from '@/lib/utils'

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
      <section className="filter-card">
        <h3 className="type-small">Filters</h3>
        
        <div className="tld-list">
          <div className="meta-list">
            <button 
              onClick={clearAllFilters}
              className="type-small text-left block w-full hover:underline"
            >
              Show all
            </button>
          </div>

          {domains.slice(0, 10).map(({ domain, count }) => {
            const on = tlds.has(domain);
            
            return (
              <button 
                key={domain}
                className={`type-small text-left block w-full hover:underline ${on ? '' : 'state-inactive'}`}
                onClick={() => toggleTld(domain)}
              >
                {cleanDomain(domain)} <span className="state-inactive">{count}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Editors Section */}
      <section className="filter-card">
        <h3 className="type-small">Editors</h3>
        
        <div className="editors-list">
          {uniqueUsers && uniqueUsers.length > 0 ? (
            uniqueUsers.slice(0, 10).map((user) => (
              <Link 
                key={user.id}
                href={`/${user.username}`}
                className="user-link type-small"
                style={{
                  '--user-color1': user.color1,
                  '--user-color2': user.color2,
                } as React.CSSProperties}
              >
                @{user.username}
              </Link>
            ))
          ) : (
            <div className="type-small state-inactive" style={{ padding: '0.25rem 0.75rem' }}>
              No editors available
            </div>
          )}
        </div>
      </section>

      {/* Meta Section */}
      <section className="filter-card">
        <h3 className="type-small">Stats</h3>
        
        <div className="meta-list">
          <div className="type-small state-inactive" style={{ padding: '0.25rem 0.75rem' }}>
            {posts?.length || 0} posts
          </div>
          <div className="type-small state-inactive" style={{ padding: '0.25rem 0.75rem' }}>
            {allUniqueUrls.length} urls
          </div>
          <div className="type-small state-inactive" style={{ padding: '0.25rem 0.75rem' }}>
            {Object.keys(uniqueDomainCounts).length} domains
          </div>
        </div>
      </section>
    </div>
  );
} 