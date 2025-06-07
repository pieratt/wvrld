'use client'

import Header from '@/components/Header'
import MasonryGrid, { MasonryItem } from '@/components/MasonryGrid'
import PostCard from '@/components/PostCard'
import { useGroupedPosts } from '@/hooks/useGroupedPosts'
import useSWR from 'swr'
import { URLWithPost } from './api/urls/route'
import { DomainFilterBar } from '@/components/DomainFilterBar'
import { FeedFiltersProvider, useFeedFilters } from '@/contexts/FeedFilters'
import { palette } from '@/lib/palette'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function Feed() {
  const { data: urls, error, isLoading } = useSWR<URLWithPost[]>('/api/urls', fetcher)
  const { tlds } = useFeedFilters()
  const groupedPosts = useGroupedPosts(urls)

  if (error) return <div>Failed to load</div>
  if (isLoading || !urls) return <div>Loading...</div>

  const filteredPosts = !tlds.size 
    ? groupedPosts 
    : groupedPosts.filter(group => 
        group.urls.some(url => url.domain && tlds.has(url.domain))
      )

  return (
    <main className="main-grid">
      <aside className="sticky top-0 h-screen pt-4">
        <DomainFilterBar />
      </aside>
      
      <section>
        {filteredPosts.map((group) => (
          <PostCard
            key={`${group.canonicalOwner.username}-${group.title}`}
            data={group}
            isFront={true}
          />
        ))}
      </section>
    </main>
  )
}

export default function HomePage() {
  return (
    <FeedFiltersProvider>
      <Feed />
    </FeedFiltersProvider>
  )
}
