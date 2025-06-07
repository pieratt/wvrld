'use client'

import React, { useEffect } from 'react'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'
import { palette, getUser } from '@/lib/palette'
import PageLayout from '@/components/PageLayout'
import PostCard from '@/components/PostCard'
import { useGroupedPosts } from '@/hooks/useGroupedPosts'
import useSWR from 'swr'
import { URLWithPost } from '../api/urls/route'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SavedPage() {
  const { savedURLs, isLoading: savedLoading } = useSavedURLsContext()
  const { data: allUrls, isLoading: urlsLoading } = useSWR<URLWithPost[]>('/api/urls', fetcher)
  const { data: systemUser, isLoading: userLoading } = useSWR('/api/users/id/1', fetcher)

  // Get system colors for saved page from database (with fallback for loading state)
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

  // Inject colors at document level so body background updates
  useEffect(() => {
    document.documentElement.style.setProperty('--c1', colors.pageFont)
    document.documentElement.style.setProperty('--c2', colors.pageBg)
  }, [colors.pageFont, colors.pageBg])

  if (!systemUser) return <div>Loading...</div>

  // Filter URLs to only saved ones
  const savedUrlIds = new Set(savedURLs.map(url => url.id))
  const savedUrlsWithPost = allUrls?.filter(url => savedUrlIds.has(url.id)) || []
  
  // Group saved URLs like the front page
  const groupedPosts = useGroupedPosts(savedUrlsWithPost)

  if (savedLoading || urlsLoading || userLoading) {
    return (
      <PageLayout
        sidebar={<div>Loading...</div>}
      >
        <div>Loading...</div>
      </PageLayout>
    )
  }

  const sidebar = (
    <div>
      <h1>Saved URLs</h1>
      <div className="meta-text">
        {savedURLs.length} saved
      </div>
    </div>
  )

  return (
    <PageLayout
      sidebar={sidebar}
    >
      {groupedPosts.length > 0 ? (
        groupedPosts.map((groupedPost) => (
          <PostCard
            key={`${groupedPost.canonicalOwner.username}-${groupedPost.title}`}
            data={groupedPost}
            isFront={true}
          />
        ))
      ) : (
        <div>No saved URLs yet</div>
      )}
    </PageLayout>
  )
} 