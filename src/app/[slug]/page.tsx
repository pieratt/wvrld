import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import MasonryGrid, { MasonryItem } from '@/components/MasonryGrid'
import URLCard from '@/components/URLCard'
import { getURLsForBucket, mockUsers } from '@/lib/mockData'

interface BucketPageProps {
  params: Promise<{ slug: string }>
}

export default async function BucketPage({ params }: BucketPageProps) {
  const { slug } = await params
  
  // Find the bucket owner
  const bucketOwner = mockUsers.find(user => user.username === slug)
  
  if (!bucketOwner) {
    notFound()
  }

  // Get URLs for this bucket
  const bucketURLs = getURLsForBucket(slug)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentBucket={bucketOwner} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bucket stats */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-12 h-12 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${bucketOwner.color1}, ${bucketOwner.color2})`
              }}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {bucketOwner.title || bucketOwner.username}
              </h1>
              {bucketOwner.description && (
                <p className="text-gray-600 mt-1">
                  {bucketOwner.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-6 text-sm text-gray-600">
            <span>{bucketURLs.length} URLs</span>
            <span>{new Set(bucketURLs.map(item => item.url.domain)).size} domains</span>
          </div>
        </div>

        {/* URL Grid */}
        {bucketURLs.length > 0 ? (
          <MasonryGrid>
            {bucketURLs.map(({ url, post }, index) => (
              <MasonryItem key={`${url.id}-${post.id}-${index}`}>
                <URLCard 
                  url={url}
                  owner={bucketOwner}
                  post={post}
                  showOwner={false}
                />
              </MasonryItem>
            ))}
          </MasonryGrid>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No URLs yet</div>
            <p className="text-gray-600">
              This bucket is empty. Start by adding some URLs.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

// Generate static params for known buckets (optional, for better performance)
export async function generateStaticParams() {
  return mockUsers
    .filter(user => user.type !== 'system')
    .map(user => ({
      slug: user.username
    }))
} 