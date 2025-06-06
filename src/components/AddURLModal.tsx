'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AddURLModalProps {
  isOpen: boolean
  onClose: () => void
  bucketSlug: string
}

export default function AddURLModal({ isOpen, onClose, bucketSlug }: AddURLModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.trim()) {
      setError('Please enter some content')
      return
    }

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
          slug: bucketSlug,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Reset form
        setFormData('')
        onClose()
        
        // Redirect to the new post if we have an ID, or refresh current page
        if (result.data.postId && bucketSlug !== 'anonymous') {
          router.push(`/${bucketSlug}/${result.data.postId}`)
        } else {
          // Refresh current page to show new content
          router.refresh()
        }
      } else {
        setError(result.error || 'Failed to add URLs')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData('')
      setError('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Add URLs {bucketSlug !== 'anonymous' ? `to ${bucketSlug}` : ''}
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="content"
                value={formData}
                onChange={(e) => setFormData(e.target.value)}
                placeholder="My awesome collection&#10;https://example.com/link1&#10;https://example.com/link2"
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isSubmitting}
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-1">
                First line becomes the post title (optional). Following lines should be URLs.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !formData.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add URLs'}
              </button>
              
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 