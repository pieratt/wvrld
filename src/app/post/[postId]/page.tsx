'use client'

import React from 'react'
import { notFound } from 'next/navigation'
import { palette } from '@/lib/palette'
import { useGroupedPosts } from '@/hooks/useGroupedPosts'
import useSWR from 'swr'
import { URLWithPost } from '../../api/urls/route'
import Link from 'next/link'

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

  return (
    <main 
      className="main-grid"
      style={{ backgroundColor: colors.pageBg, color: colors.pageFont }}
    >
      <aside className="sticky top-0 h-screen pt-4">
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
      </aside>
      
      <section>
        <div className="space-y-4">
          {targetPost.title && (
            <div className="text-center">
              <h1 className="mb-1">{targetPost.title}</h1>
              <div className="meta-text">
                by @{targetPost.canonicalOwner.username} and {targetPost.posts.length - 1} others
              </div>
            </div>
          )}
          
          {targetPost.urls.map((urlData) => (
            <div 
              key={urlData.id} 
              className="p-2"
              style={{ 
                backgroundColor: urlData.post.owner.color1, 
                color: urlData.post.owner.color2 
              }}
            >
              <div className="flex items-start gap-3">
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${urlData.domain}`}
                  alt=""
                  className="w-8 h-8 flex-shrink-0 mt-1"
                />
                
                <div className="flex-1">
                  <a 
                    href={urlData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:underline mb-1"
                  >
                    {urlData.title || urlData.url}
                  </a>
                  
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/${urlData.post.owner.username}/${urlData.post.id}`}
                      className="hover:underline"
                      style={{ opacity: 1 }}
                    >
                      @{urlData.post.owner.username}
                    </Link>
                    <a 
                      href={urlData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline meta-text"
                    >
                      {urlData.domain}
                    </a>
                    <span className="meta-text">
                      {urlData.saves} saved
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
} 