'use client'

import Header from '@/components/Header'
import MasonryGrid, { MasonryItem } from '@/components/MasonryGrid'
import PostCard from '@/components/PostCard'
import { useGroupedPosts } from '@/hooks/useGroupedPosts'
import useSWR from 'swr'
import { URLWithPost } from './api/urls/route'
import { DomainFilterBar } from '@/components/DomainFilterBar'
import { FeedFiltersProvider, useFeedFilters } from '@/contexts/FeedFilters'
import { palette, getUser } from '@/lib/palette'
import PageLayout from '@/components/PageLayout'
import { useEffect } from 'react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function Feed() {
  const { data: urls, error: urlsError, isLoading: urlsLoading } = useSWR<URLWithPost[]>('/api/urls', fetcher)
  const { data: systemUser, error: userError, isLoading: userLoading } = useSWR('/api/users/id/1', fetcher)
  const { tlds } = useFeedFilters()
  const groupedPosts = useGroupedPosts(urls)

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

  // Inject colors at document level so body background updates
  useEffect(() => {
    document.documentElement.style.setProperty('--c1', colors.pageFont)
    document.documentElement.style.setProperty('--c2', colors.pageBg)
  }, [colors.pageFont, colors.pageBg])

  if (urlsError || userError) return <div>Failed to load</div>
  if (urlsLoading || userLoading || !urls || !systemUser) return <div>Loading...</div>

  const filteredPosts = !tlds.size 
    ? groupedPosts 
    : groupedPosts.filter(group => 
        group.urls.some(url => url.domain && tlds.has(url.domain))
      )

  return (
    <PageLayout 
      sidebar={<DomainFilterBar />}
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
