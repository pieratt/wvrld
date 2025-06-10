'use client'

import Header from '@/components/Header'
import MasonryGrid, { MasonryItem } from '@/components/MasonryGrid'
import PostCard from '@/components/PostCard'
import { useGroupedPosts } from '@/hooks/useGroupedPosts'
import { useFilteredGroupedPosts } from '@/hooks/useFilteredGroupedPosts'
import useSWR from 'swr'
import { PostWithURLs } from './api/posts/route'
import { UnifiedSidebar } from '@/components/UnifiedSidebar'
import { FeedFiltersProvider, useFeedFilters } from '@/contexts/FeedFilters'
import { palette, getUser } from '@/lib/palette'
import PageLayout from '@/components/PageLayout'
import { useEffect } from 'react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function Feed() {
  const { data: posts, error: postsError, isLoading: postsLoading } = useSWR<PostWithURLs[]>('/api/posts', fetcher)
  const { data: systemUser, error: userError, isLoading: userLoading } = useSWR('/api/users/id/1', fetcher)
  const { tlds } = useFeedFilters()
  const groupedPosts = useGroupedPosts(posts)
  const filteredPosts = useFilteredGroupedPosts(groupedPosts, tlds)

  // Get system user colors for front page from database (with fallback for loading state)
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

  // Inject only font color at document level
  useEffect(() => {
    document.documentElement.style.setProperty('--c1', colors.pageFont)
  }, [colors.pageFont])

  if (postsError || userError) return <div>Failed to load</div>
  if (postsLoading || userLoading || !posts || !systemUser) return <div>Loading...</div>

  return (
    <PageLayout 
      sidebar={<UnifiedSidebar />}
    >
      {filteredPosts.map((group) => (
        <PostCard
          key={`${group.canonicalOwner.username}-${group.title}`}
          data={group}
          isFront={true}
        />
      ))}
    </PageLayout>
  )
}

export default function HomePage() {
  return (
    <FeedFiltersProvider>
      <Feed />
    </FeedFiltersProvider>
  )
}
