'use client'

import React from 'react'
import { notFound } from 'next/navigation'
import { palette } from '@/lib/palette'
import useSWR from 'swr'
import { UserWithStats } from '../../api/users/[username]/route'
import { PostWithDetails } from '../../api/posts/[postId]/route'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PostPageProps {
  params: Promise<{ slug: string; postId: string }>
}

export default function PostPage({ params }: PostPageProps) {
  const { slug, postId } = React.use(params)
  
  const { data: user, error: userError } = useSWR<UserWithStats>(`/api/users/${slug}`, fetcher)
  const { data: post, error: postError } = useSWR<PostWithDetails>(`/api/posts/${postId}`, fetcher)

  // Handle not found
  if ((userError && userError.status === 404) || (postError && postError.status === 404)) {
    notFound()
  }

  if (userError || postError) {
    return <div>Error loading content</div>
  }

  if (!user || !post) {
    return <div>Loading...</div>
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
    <main 
      className="main-grid"
      style={{ backgroundColor: colors.pageBg, color: colors.pageFont }}
    >
      <aside className="sticky top-0 h-screen pt-4">
        <div className="space-y-2">
          <Link href={`/${slug}`} className="hover:underline">
            ← {user.title || user.username}
          </Link>
          
          <div className="meta-text">
            <div>Post #{post.id}</div>
            <div>{post.urls.length} URLs</div>
          </div>
          
          <Link href={`/${slug}/${postId}/edit`} className="hover:underline">
            edit post
          </Link>
        </div>
      </aside>
      
      <section>
        <div className="space-y-4">
          {post.title && (
            <h1>{post.title}</h1>
          )}
          
          {post.urls.map((url: any) => (
            <div key={url.id} className="space-y-1">
              <a 
                href={url.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:underline"
              >
                {url.title || url.url}
              </a>
              
              <div className="meta-text flex items-center gap-2">
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${url.domain}`}
                  alt=""
                  className="w-4 h-4"
                />
                <span>{url.domain}</span>
                <span>saved</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
} 