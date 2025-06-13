'use client'

import React, { useEffect } from 'react'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'
import { palette, getUser } from '@/lib/palette'
import PageLayout from '@/components/PageLayout'
import PostCard from '@/components/PostCard'
import AddPostInput from '@/components/AddPostInput'
import OverlayNav from '@/components/OverlayNav'
import { useGroupedPosts } from '@/hooks/useGroupedPosts'
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

export default function SavedPage() {
  const { savedURLs, isLoading: savedLoading } = useSavedURLsContext()
  const { data: allUrls, isLoading: urlsLoading, mutate } = useSWR<URLWithPost[]>('/api/urls', fetcher)
  const { data: systemUser, isLoading: userLoading } = useSWR('/api/users/id/1', fetcher)

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

  if (!systemUser) return <div>Loading...</div>

  // Filter URLs to only saved ones
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
  
  // Group saved URLs like the front page
  const groupedPosts = useGroupedPosts(convertedPosts)

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
      <div style={{ paddingTop: '120px' }}>
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
      </div>
    </>
  )
} 