'use client'

import React from 'react'
import { notFound } from 'next/navigation'
import { palette } from '@/lib/palette'
import { useGroupedPosts } from '@/hooks/useGroupedPosts'
import useSWR from 'swr'
import { URLWithPost } from '../../api/urls/route'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import PostCard from '@/components/PostCard'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface UniversalPostPageProps {
  params: Promise<{ postId: string }>
}

export default function UniversalPostPage({ params }: UniversalPostPageProps) {
  const { postId } = React.use(params)
  
  const { data: urls, error, isLoading } = useSWR<URLWithPost[]>('/api/urls', fetcher)
  const groupedPosts = useGroupedPosts(urls)

  if (error) return <div>Error loading content</div>
  if (isLoading || !urls) return <div>Loading...</div>

  // Find the grouped post that contains the specified postId
  const targetPost = groupedPosts.find(group => 
    group.posts.some(post => post.id === parseInt(postId))
  )

  if (!targetPost) {
    notFound()
  }

  // Create page owner object from canonical owner (first creator)
  const pageOwner = {
    id: targetPost.canonicalOwner.id,
    username: targetPost.canonicalOwner.username,
    title: targetPost.canonicalOwner.title,
    description: null,
    image1: null,
    image2: null,
    color1: targetPost.canonicalOwner.color1,
    color2: targetPost.canonicalOwner.color2,
    type: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Get page colors from the canonical owner (first creator)
  const colors = palette({
    cardOwner: pageOwner,
    isFront: false,
    pageOwner
  });

  const sidebar = (
    <div className="space-y-2">
      <Link href="/" className="hover:underline">
        ← home
      </Link>
      
      <div className="meta-text">
        <div>Universal Post #{postId}</div>
        <div>{targetPost.urls.length} URLs</div>
        <div>{targetPost.posts.length} contributors</div>
      </div>
    </div>
  )

  return (
    <PageLayout
      style={{
        '--c1': colors.pageFont,
        '--c2': colors.pageBg,
        backgroundColor: 'var(--c2)',
        color: 'var(--c1)',
        minHeight: '100vh',
      } as React.CSSProperties}
      sidebar={sidebar}
    >
      <PostCard
        data={targetPost}
        isFront={false}
        pageOwner={pageOwner}
      />
    </PageLayout>
  )
} 