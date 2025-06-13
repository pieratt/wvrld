'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AddPostInputProps {
  bucketSlug: string
  userColors?: {
    color1: string
    color2: string
  }
  onPostAdded?: () => void
}

export default function AddPostInput({ bucketSlug, userColors, onPostAdded }: AddPostInputProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current && isExpanded) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 80)}px`
    }
  }, [content, isExpanded])

  return (
    <div 
      className="cli-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: colors.color1,
        transition: 'all 0.3s ease-in-out',
        height: isExpanded ? 'auto' : '32px',
        maxHeight: isExpanded ? '40vh' : '32px',
        overflow: 'hidden',
      }}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder=""
        disabled={isSubmitting}
        className="cli-input"
        style={{
          width: '100%',
          height: isExpanded ? 'auto' : '32px',
          minHeight: '32px',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          padding: isExpanded ? '12px 16px' : '8px 16px',
          backgroundColor: 'transparent',
          color: colors.color2,
          transition: 'all 0.3s ease-in-out',
          lineHeight: isExpanded ? '1.4' : '1.2',
          overflow: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        } as React.CSSProperties}
      />
      
      {status && isExpanded && (
        <div 
          className="cli-status"
          style={{
            padding: '8px 16px',
            backgroundColor: colors.color2,
            color: colors.color1,
            fontSize: '12px',
          }}
        >
          {status}
        </div>
      )}
    </div>
  )
} 