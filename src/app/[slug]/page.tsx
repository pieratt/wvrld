'use client'

import React from 'react'
import { notFound } from 'next/navigation'
import PostCard from '@/components/PostCard'
import { useGroupedPosts } from '@/hooks/useGroupedPosts'
import { useFilteredGroupedPosts } from '@/hooks/useFilteredGroupedPosts'
import { palette } from '@/lib/palette'
import useSWR from 'swr'
import { PostWithURLs } from '../api/posts/route'
import { UserWithStats } from '../api/users/[username]/route'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import { FeedFiltersProvider, useFeedFilters } from '@/contexts/FeedFilters'
import { UnifiedSidebar } from '@/components/UnifiedSidebar'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface BucketPageProps {
  params: Promise<{ slug: string }>
}

function BucketPageContent({ slug }: { slug: string }) {
  const { data: user, error: userError } = useSWR<UserWithStats>(`/api/users/${slug}`, fetcher)
  const { data: posts, error: postsError, isLoading } = useSWR<PostWithURLs[]>(`/api/posts?bucket=${slug}`, fetcher)
  const { tlds } = useFeedFilters()
  const groupedPosts = useGroupedPosts(posts)
  const filteredPosts = useFilteredGroupedPosts(groupedPosts, tlds)

  // Create pageOwner object (with fallback values for when user is not loaded yet)
  const pageOwner = user ? {
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
  } : {
    id: 1,
    username: 'loading',
    title: 'Loading...',
    description: null,
    image1: null,
    image2: null,
    color1: '#eeeeee',
    color2: '#111111',
    type: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Get page colors from the page owner (user)
  const colors = palette({
    cardOwner: pageOwner,
    isFront: false,
    pageOwner: pageOwner
  });

  // Inject only font color at document level
  React.useEffect(() => {
    document.documentElement.style.setProperty('--c1', colors.pageFont)
  }, [colors.pageFont])

  // Handle user not found
  if (userError && userError.status === 404) {
    notFound()
  }

  if (userError || postsError) {
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

  // Use the actual user data for the sidebar (not the fallback pageOwner)
  const actualUser = user!; // Safe to use since we've already checked if user exists

  return (
    <PageLayout
      sidebar={
        <UnifiedSidebar 
          bucket={slug}
          userInfo={{
            title: actualUser.title,
            username: actualUser.username,
            description: actualUser.description,
            stats: actualUser.stats
          }}
        />
      }
    >
      {filteredPosts && filteredPosts.length > 0 ? (
        filteredPosts.map((groupedPost) => (
          <PostCard
            key={`${groupedPost.canonicalOwner.username}-${groupedPost.title}`}
            data={groupedPost}
            isFront={false}
            pageOwner={{
              id: actualUser.id,
              username: actualUser.username,
              title: actualUser.title,
              color1: actualUser.color1,
              color2: actualUser.color2,
              type: actualUser.type || 'user'
            }}
          />
        ))
      ) : (
        <div>This bucket is empty</div>
      )}
    </PageLayout>
  )
}

export default function BucketPage({ params }: BucketPageProps) {
  const { slug } = React.use(params)
  
  return (
    <FeedFiltersProvider>
      <BucketPageContent slug={slug} />
    </FeedFiltersProvider>
  )
} 