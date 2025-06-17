'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ColorPicker from './ColorPicker'
import useSWR from 'swr'

interface AddPostInputProps {
  bucketSlug: string
  userColors?: {
    color1: string
    color2: string
  }
  onPostAdded?: () => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AddPostInput({ bucketSlug, userColors, onPostAdded }: AddPostInputProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get current user (assuming user 1 for now - in a real app this would come from auth)
  const { data: currentUser, mutate: mutateUser } = useSWR('/api/users/id/1', fetcher)

  // Default colors if none provided
  const colors = userColors || {
    color1: '#111111',
    color2: '#eeeeee'
  }

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    setStatus('Collecting metadata...')

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawText: content,
          slug: bucketSlug,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setContent('')
        setIsExpanded(false)
        setStatus('Posted!')
        
        // Clear status after a moment
        setTimeout(() => setStatus(null), 2000)
        
        // Notify parent component and refresh feed
        if (onPostAdded) {
          onPostAdded()
        } else {
          router.refresh()
        }
      } else {
        setStatus(`Error: ${result.error}`)
        setTimeout(() => setStatus(null), 3000)
      }
    } catch (err) {
      setStatus('Network error. Please try again.')
      setTimeout(() => setStatus(null), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setContent(value)
    
    // Check for /color trigger
    if (value.endsWith('/color')) {
      // Remove /color from content and open color picker
      setContent(value.slice(0, -6))
      setIsExpanded(false) // Collapse the input
      setIsColorPickerOpen(true)
      // Blur the textarea to ensure it collapses
      if (textareaRef.current) {
        textareaRef.current.blur()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setIsExpanded(false)
      if (textareaRef.current) {
        textareaRef.current.blur()
      }
    }
  }

  const handleFocus = () => {
    setIsExpanded(true)
  }

  const handleBlur = () => {
    // Only collapse if empty
    if (!content.trim()) {
      setIsExpanded(false)
    }
  }

  const handleColorPickerSave = (color1: string, color2: string) => {
    // Refresh user data to get updated colors
    mutateUser()
    // Refresh the parent component if needed
    if (onPostAdded) {
      onPostAdded()
    }
  }

  const handleColorPickerClose = () => {
    setIsColorPickerOpen(false)
  }

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current && isExpanded) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 80)}px`
    }
  }, [content, isExpanded])

  return (
    <>
      <div 
        className="cli-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'var(--c1, #111111)',
        transition: 'all 0.3s ease-in-out',
        height: isExpanded ? 'auto' : '32px',
        maxHeight: isExpanded ? '40vh' : '32px',
        overflow: 'hidden',
      }}
    >
              <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder=""
          disabled={isSubmitting}
        className="cli-input type-small"
        style={{
          width: '100%',
          height: isExpanded ? 'auto' : '32px',
          minHeight: '32px',
          border: 'none',
          outline: 'none',
          resize: 'none',
          padding: isExpanded ? '12px 16px' : '8px 16px',
          backgroundColor: 'transparent',
          color: 'var(--c2, #eeeeee)',
          transition: 'all 0.3s ease-in-out',
          lineHeight: isExpanded ? '1.4' : '1.2',
          overflow: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        } as React.CSSProperties}
      />
      
      {status && isExpanded && (
        <div 
          className="cli-status type-small"
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--c2, #eeeeee)',
            color: 'var(--c1, #111111)',
          }}
        >
          {status}
        </div>
      )}
    </div>
    
    {/* Color Picker Modal */}
    {currentUser && (
      <ColorPicker
        isOpen={isColorPickerOpen}
        onClose={handleColorPickerClose}
        onSave={handleColorPickerSave}
        initialColor1={currentUser.color1}
        initialColor2={currentUser.color2}
        currentUser={currentUser}
      />
    )}
    </>
  )
} 