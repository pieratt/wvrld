'use client'

import React from 'react'
import { notFound } from 'next/navigation'
import PostCard from '@/components/PostCard'
import { useGroupedPosts } from '@/hooks/useGroupedPosts'
import { palette } from '@/lib/palette'
import useSWR from 'swr'
import { URLWithPost } from '../api/urls/route'
import { UserWithStats } from '../api/users/[username]/route'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface BucketPageProps {
  params: Promise<{ slug: string }>
}

export default function BucketPage({ params }: BucketPageProps) {
  const { slug } = React.use(params)
  
  const { data: user, error: userError } = useSWR<UserWithStats>(`/api/users/${slug}`, fetcher)
  const { data: urls, error: urlsError, isLoading } = useSWR<URLWithPost[]>(`/api/urls?bucket=${slug}`, fetcher)
  const groupedPosts = useGroupedPosts(urls)

  // Handle user not found
  if (userError && userError.status === 404) {
    notFound()
  }

  if (userError || urlsError) {
    return (
      <main className="main-grid">
        <aside></aside>
        <section>
          <div>Error loading content</div>
        </section>
      </main>
    )
  }

  if (isLoading || !user) {
    return (
      <main className="main-grid">
        <aside></aside>
        <section>
          <div>Loading...</div>
        </section>
      </main>
    )
  }

  const pageOwner = {
    id: user.id,
    username: user.username,
    title: user.title,
    description: user.description,
    image1: null,
    image2: null,
    color1: user.color1,
    color2: user.color2,
    type: user.type || 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Get page colors for this user's bucket
  const colors = palette({
    cardOwner: pageOwner,
    isFront: false,
    pageOwner
  });

  return (
    <div 
      style={{
        '--c1': colors.pageFont,
        '--c2': colors.pageBg,
        backgroundColor: 'var(--c2)',
        color: 'var(--c1)',
        minHeight: '100vh',
      } as React.CSSProperties}
    >
      <main className="main-grid">
        <aside className="sticky top-0 h-screen pt-4">
          <div className="space-y-2">
            <h1>{user.title || user.username}</h1>
            {user.description && (
              <p className="meta-text">{user.description}</p>
            )}
            <div className="meta-text">
              <div>{user.stats.totalURLs} URLs</div>
              <div>{user.stats.uniqueDomains} domains</div>
              <div>{user.stats.totalPosts} posts</div>
            </div>
            <Link href={`/${slug}/edit`} className="hover:underline">
              edit bucket
            </Link>
          </div>
        </aside>
        
        <section>
          {groupedPosts && groupedPosts.length > 0 ? (
            groupedPosts.map((groupedPost) => (
              <PostCard
                key={`${groupedPost.canonicalOwner.username}-${groupedPost.title}`}
                data={groupedPost}
                isFront={false}
                pageOwner={pageOwner}
              />
            ))
          ) : (
            <div>This bucket is empty</div>
          )}
        </section>
      </main>
    </div>
  )
} 