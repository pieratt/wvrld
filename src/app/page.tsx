'use client'

import Header from '@/components/Header'
import MasonryGrid, { MasonryItem } from '@/components/MasonryGrid'
import URLCard from '@/components/URLCard'
import useSWR from 'swr'
import { URLWithPost } from './api/urls/route'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function HomePage() {
  const { data: urls, error, isLoading } = useSWR<URLWithPost[]>('/api/urls', fetcher)

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error loading content</h1>
            <p className="text-gray-600">Please try refreshing the page.</p>
          </div>
        </main>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg h-48 shadow-sm"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WVRLD Front Feed
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover curated links and collections from the community. 
            Each URL is colored by its bucket owner.
          </p>
        </div>

        {urls && urls.length > 0 ? (
          <MasonryGrid>
            {urls.map((urlData) => (
              <MasonryItem key={`${urlData.post.id}-${urlData.id}`}>
                <URLCard
                  url={{
                    id: urlData.id,
                    url: urlData.url,
                    title: urlData.title,
                    description: urlData.description,
                    domain: urlData.domain,
                    saves: urlData.saves,
                    clicks: urlData.clicks
                  }}
                  owner={{
                    id: urlData.post.owner.id,
                    username: urlData.post.owner.username,
                    title: urlData.post.owner.title,
                    color1: urlData.post.owner.color1,
                    color2: urlData.post.owner.color2
                  }}
                  post={{
                    id: urlData.post.id,
                    title: urlData.post.title
                  }}
                  showOwner={true}
                />
              </MasonryItem>
            ))}
          </MasonryGrid>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No URLs yet
            </h2>
            <p className="text-gray-500">
              Be the first to share something interesting!
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
