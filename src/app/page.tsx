import Header from '@/components/Header'
import MasonryGrid, { MasonryItem } from '@/components/MasonryGrid'
import URLCard from '@/components/URLCard'
import { getAllURLs, mockUsers } from '@/lib/mockData'

export default function HomePage() {
  const allURLs = getAllURLs()
  const anonymousUser = mockUsers.find(u => u.username === 'anonymous')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentBucket={anonymousUser} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Front Feed
          </h2>
          <p className="text-gray-600">
            All URLs from every bucket, grouped by domain and colored by bucket
          </p>
        </div>

        {/* URL Grid */}
        <MasonryGrid>
          {allURLs.map(({ url, post, owner }, index) => (
            <MasonryItem key={`${url.id}-${post.id}-${index}`}>
              <URLCard 
                url={url}
                owner={owner}
                post={post}
                showOwner={true}
              />
            </MasonryItem>
          ))}
        </MasonryGrid>

        {/* Empty state */}
        {allURLs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No URLs yet</div>
            <p className="text-gray-600">
              Start by adding some URLs to create your first post
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
