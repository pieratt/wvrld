'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import useSWR from 'swr'
import { UserWithStats } from '../../../api/users/[username]/route'
import { PostWithDetails } from '../../../api/posts/[postId]/route'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PostEditPageProps {
  params: Promise<{ slug: string; postId: string }>
}

export default function PostEditPage({ params }: PostEditPageProps) {
  const { slug, postId } = React.use(params)
  const router = useRouter()
  
  const { data: user, error: userError } = useSWR<UserWithStats>(`/api/users/${slug}`, fetcher)
  const { data: post, error: postError, mutate } = useSWR<PostWithDetails>(`/api/posts/${postId}`, fetcher)
  
  const [formData, setFormData] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Initialize form data when post loads
  React.useEffect(() => {
    if (post && !formData) {
      // Use the original prompt text if available, otherwise reconstruct from title + URLs
      if (post.prompt?.rawText) {
        setFormData(post.prompt.rawText)
      } else {
        const reconstructed = [
          post.title || '',
          ...post.urls
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(url => url.url)
        ].filter(Boolean).join('\n')
        setFormData(reconstructed)
      }
    }
  }, [post, formData])

  // Handle not found
  if (userError && userError.status === 404) {
    notFound()
  }
  
  if (postError && postError.status === 404) {
    notFound()
  }

  if (userError || postError) {
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

  if (!user || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          </div>
        </main>
      </div>
    )
  }

  // Verify post belongs to this bucket
  if (post.owner.username !== slug) {
    notFound()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawText: formData,
          slug: slug,
          editing: {
            type: 'post',
            id: parseInt(postId, 10)
          }
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh post data
        await mutate()
        // Redirect back to post page
        router.push(`/${slug}/${postId}`)
      } else {
        setError(result.error || 'Failed to update post')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const gradientStyle = {
    background: `linear-gradient(135deg, ${user.color1}, ${user.color2})`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentBucket={{
          id: user.id,
          username: user.username,
          title: user.title,
          description: user.description,
          color1: user.color1,
          color2: user.color2,
          type: user.type || 'user'
        }} 
      />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            href={`/${slug}/${postId}`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to post
          </Link>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="w-12 h-12 rounded-full"
              style={gradientStyle}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Post
              </h1>
              <p className="text-gray-600">Update your post title and URLs</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Post Content
              </label>
              <textarea
                id="content"
                value={formData}
                onChange={(e) => setFormData(e.target.value)}
                placeholder="My awesome collection&#10;https://example.com/link1&#10;https://example.com/link2"
                className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1">
                First line becomes the post title. Following lines should be URLs.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push(`/${slug}/${postId}`)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
} 