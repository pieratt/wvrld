'use client'

import React, { useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import { palette } from '@/lib/palette'
import useSWR from 'swr'
import { UserWithStats } from '../../api/users/[username]/route'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface BucketEditPageProps {
  params: Promise<{ slug: string }>
}

export default function BucketEditPage({ params }: BucketEditPageProps) {
  const { slug } = React.use(params)
  const router = useRouter()
  
  const { data: user, error: userError } = useSWR<UserWithStats>(`/api/users/${slug}`, fetcher)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form when user data loads
  React.useEffect(() => {
    if (user) {
      setTitle(user.title || '')
      setDescription(user.description || '')
    }
  }, [user])

  // Handle user not found
  if (userError && userError.status === 404) {
    notFound()
  }

  if (userError) {
    return <div>Error loading user</div>
  }

  if (!user) {
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

  // Get page colors from the page owner (user)
  const colors = palette({
    cardOwner: pageOwner,
    isFront: false,
    pageOwner: pageOwner
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
          rawText: `${title}\n${description}`,
          slug,
          editing: {
            type: 'user'
          }
        }),
      })

      if (response.ok) {
        router.push(`/${slug}`)
      } else {
        console.error('Failed to update bucket')
      }
    } catch (error) {
      console.error('Error updating bucket:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main 
      className="main-grid"
      style={{ color: colors.pageFont }}
    >
      <aside className="sticky top-0 h-screen pt-4">
        <div>
          <h1>Edit Bucket</h1>
        </div>
      </aside>
      
      <section>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300"
            />
          </div>
          
          <div>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300"
              rows={3}
            />
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
              onClick={() => router.push(`/${slug}`)}
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