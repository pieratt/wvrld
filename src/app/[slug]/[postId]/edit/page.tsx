'use client'

import React, { useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import { palette } from '@/lib/palette'
import useSWR from 'swr'
import { UserWithStats } from '../../../api/users/[username]/route'
import { PostWithDetails } from '../../../api/posts/[postId]/route'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PostEditPageProps {
  params: Promise<{ slug: string; postId: string }>
}

export default function PostEditPage({ params }: PostEditPageProps) {
  const { slug, postId } = React.use(params)
  const router = useRouter()
  
  const { data: user, error: userError } = useSWR<UserWithStats>(`/api/users/${slug}`, fetcher)
  const { data: post, error: postError } = useSWR<PostWithDetails>(`/api/posts/${postId}`, fetcher)
  
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form when post loads
  React.useEffect(() => {
    if (post) {
      const lines = []
      if (post.title) lines.push(post.title)
      post.urls.forEach(url => lines.push(url.url))
      setContent(lines.join('\n'))
    }
  }, [post])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawText: content,
          slug,
          editing: {
            type: 'post',
            id: parseInt(postId)
          }
        }),
      })

      if (response.ok) {
        router.push(`/${slug}/${postId}`)
      } else {
        console.error('Failed to update post')
      }
    } catch (error) {
      console.error('Error updating post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main 
      className="main-grid"
      style={{ backgroundColor: colors.pageBg, color: colors.pageFont }}
    >
      <aside className="sticky top-0 h-screen pt-4">
        <div className="space-y-2">
          <Link href={`/${slug}/${postId}`} className="hover:underline">
            ← back to post
          </Link>
          
          <div className="meta-text">
            <div>Post #{post.id}</div>
            <div>Edit Mode</div>
          </div>
        </div>
      </aside>
      
      <section>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="My awesome collection
https://example.com
https://github.com/user/repo"
              className="w-full p-2 border border-gray-300 h-64"
            />
            <p className="meta-text">First line = title (optional), following lines = URLs</p>
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push(`/${slug}/${postId}`)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  )
} 