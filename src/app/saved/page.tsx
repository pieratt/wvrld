'use client'

import React, { useEffect } from 'react'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'
import { palette, getUser } from '@/lib/palette'
import PageLayout from '@/components/PageLayout'
import PostCard from '@/components/PostCard'
import AddPostInput from '@/components/AddPostInput'
import OverlayNav from '@/components/OverlayNav'
import { useGroupedPosts } from '@/hooks/useGroupedPosts'
import { useFilteredGroupedPosts } from '@/hooks/useFilteredGroupedPosts'
import { UserBio } from '@/components/UserBio'
import { FeedFiltersProvider, useFeedFilters } from '@/contexts/FeedFilters'
import useSWR from 'swr'
import { URLWithPost } from '../api/urls/route'

interface PostWithURLs {
  id: number
  title: string | null
  createdAt: string
  owner: {
    id: number
    username: string
    title: string | null
    color1: string
    color2: string
  }
  urls: {
    id: number
    url: string
    domain: string | null
    title: string | null
    description: string | null
    saves: number
    clicks: number
    createdAt: string
  }[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function SavedPageContent() {
  // CRITICAL: Call ALL hooks at the top, in the same order every time
  const { savedURLs, isLoading: savedLoading } = useSavedURLsContext()
  const { data: allUrls, isLoading: urlsLoading, mutate } = useSWR<URLWithPost[]>('/api/urls', fetcher)
  const { data: systemUser, isLoading: userLoading } = useSWR('/api/users/id/1', fetcher)
  const { tlds, toggleTld } = useFeedFilters()

  // Prepare data for hooks (but ensure it never returns undefined to avoid conditional hook calls)
  const savedUrlIds = new Set(savedURLs.map(url => url.id))
  const savedUrlsWithPost = allUrls?.filter(url => savedUrlIds.has(url.id)) || []
  
  // Convert URLWithPost[] to PostWithURLs[] format for useGroupedPosts
  const convertedPosts = savedUrlsWithPost.reduce((posts: PostWithURLs[], urlWithPost) => {
    const postId = urlWithPost.post.id
    const existingPost = posts.find(p => p.id === postId)
    
    if (existingPost) {
      // Add URL to existing post if not already there
      if (!existingPost.urls.some((u: any) => u.id === urlWithPost.id)) {
        existingPost.urls.push({
          id: urlWithPost.id,
          url: urlWithPost.url,
          domain: urlWithPost.domain,
          title: urlWithPost.title,
          description: urlWithPost.description,
          saves: urlWithPost.saves,
          clicks: urlWithPost.clicks,
          createdAt: urlWithPost.createdAt
        })
      }
    } else {
      // Create new post with this URL
      posts.push({
        id: urlWithPost.post.id,
        title: urlWithPost.post.title,
        createdAt: urlWithPost.createdAt, // Use URL's createdAt as fallback
        owner: urlWithPost.post.owner,
        urls: [{
          id: urlWithPost.id,
          url: urlWithPost.url,
          domain: urlWithPost.domain,
          title: urlWithPost.title,
          description: urlWithPost.description,
          saves: urlWithPost.saves,
          clicks: urlWithPost.clicks,
          createdAt: urlWithPost.createdAt
        }]
      })
    }
    return posts
  }, [])
  
  // ALWAYS call these hooks - they must be called in the same order every render
  const groupedPosts = useGroupedPosts(convertedPosts)
  const filteredPosts = useFilteredGroupedPosts(groupedPosts, tlds)

  // Get system user colors for saved page from database (with fallback for loading state)
  const colors = systemUser ? palette({
    cardOwner: {
      id: systemUser.id,
      username: systemUser.username,
      title: systemUser.title,
      color1: systemUser.color1,
      color2: systemUser.color2,
      type: systemUser.type || 'system'
    },
    isFront: true,
    pageOwner: undefined
  }) : {
    pageFont: '#eeeeee',
    pageBg: '#111111',
    cardBg: '#eeeeee',
    cardFont: '#111111',
    pillBg: '#111111',
    pillFont: '#eeeeee'
  }

  // Inject font and background colors at document level
  useEffect(() => {
    document.documentElement.style.setProperty('--c1', colors.pageFont)
    document.documentElement.style.setProperty('--c2', colors.pageBg)
  }, [colors.pageFont, colors.pageBg])

  const handlePostAdded = () => {
    // Refresh the URLs data
    mutate()
  }

  // NOW handle loading states after all hooks are called
  if (savedLoading || urlsLoading || userLoading || !systemUser) {
    return (
      <PageLayout
        sidebar={<div>Loading...</div>}
      >
        <div>Loading...</div>
      </PageLayout>
    )
  }

  // Calculate domain counts from saved URLs
  const domainCounts = savedUrlsWithPost?.reduce((acc, urlWithPost) => {
    if (urlWithPost.domain) {
      acc[urlWithPost.domain] = (acc[urlWithPost.domain] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>) || {}

  const domains = Object.entries(domainCounts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)

  // Get unique users from saved URLs for the Editors section
  type UserType = {id: number, username: string, title: string | null, color1: string, color2: string}
  const uniqueUsers = savedUrlsWithPost?.reduce((acc: UserType[], urlWithPost) => {
    const userId = urlWithPost.post.owner.id
    if (!acc.some((user: UserType) => user.id === userId)) {
      acc.push(urlWithPost.post.owner)
    }
    return acc
  }, [] as UserType[]) || []

  const clearAllFilters = () => {
    Array.from(tlds).forEach(domain => toggleTld(domain))
  }

  const sidebar = (
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
              {savedURLs.length} saved URLs
            </div>
            <div className="text-sm meta-text" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}>
              {Object.keys(domainCounts).length} domains
            </div>
            <div className="text-sm meta-text" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}>
              {groupedPosts.length} posts
            </div>
          </nav>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <AddPostInput 
        bucketSlug="anonymous"
        userColors={{
          color1: systemUser.color1,
          color2: systemUser.color2
        }}
        onPostAdded={handlePostAdded}
      />
      <OverlayNav />
      <div 
        style={{ 
          paddingTop: '120px',
          backgroundColor: colors.pageBg,
          color: colors.pageFont,
          minHeight: '100vh'
        }}
      >
        <PageLayout
          sidebar={sidebar}
        >
          <UserBio
            title="Saved URLs"
            username="saved"
            description={null}
            stats={{
              totalPosts: groupedPosts.length,
              totalURLs: savedURLs.length,
              uniqueDomains: Object.keys(domainCounts).length
            }}
            showEditLink={false}
          />
          {filteredPosts.length > 0 ? (
            filteredPosts.map((groupedPost) => (
              <PostCard
                key={`${groupedPost.canonicalOwner.username}-${groupedPost.title}`}
                data={groupedPost}
                isFront={true}
              />
            ))
          ) : (
            <div>No saved URLs {tlds.size > 0 ? 'matching filters' : 'yet'}</div>
          )}
        </PageLayout>
      </div>
    </>
  )
}

export default function SavedPage() {
  return (
    <FeedFiltersProvider>
      <SavedPageContent />
    </FeedFiltersProvider>
  )
} 