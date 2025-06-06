'use client'

import { useMemo } from 'react'

interface User {
  id: number
  username: string
  title: string | null
  color1: string
  color2: string
}

interface Post {
  id: number
  title: string | null
  owner: User
}

interface URLWithPost {
  id: number
  url: string
  domain: string | null
  title: string | null
  description: string | null
  image1: string | null
  saves: number
  clicks: number
  createdAt: string
  post: Post
}

export interface GroupedPost {
  title: string
  canonicalOwner: User   // first poster
  posts: Post[]          // all contributors incl. canonical
  urls: URLWithPost[]    // all URLs from all posts in this group
}

function slugify(str: string | null): string {
  if (!str) return ''
  return str.toLowerCase().trim()
}

export function useGroupedPosts(urls: URLWithPost[] = []): GroupedPost[] {
  return useMemo(() => {
    const groupMap = new Map<string, GroupedPost>()
    
    // Group URLs by their post's slugified title
    urls.forEach(urlData => {
      const postTitle = urlData.post.title || 'Untitled'
      const slugifiedTitle = slugify(postTitle)
      
      if (!groupMap.has(slugifiedTitle)) {
        // Create new group with this post as canonical
        groupMap.set(slugifiedTitle, {
          title: postTitle,
          canonicalOwner: urlData.post.owner,
          posts: [urlData.post],
          urls: [urlData]
        })
      } else {
        // Add to existing group
        const group = groupMap.get(slugifiedTitle)!
        
        // Check if we've seen this post before in this group
        const existingPost = group.posts.find(p => p.id === urlData.post.id)
        if (!existingPost) {
          group.posts.push(urlData.post)
        }
        
        group.urls.push(urlData)
      }
    })
    
    // Convert to array and sort by creation time (newest first)
    return Array.from(groupMap.values()).sort((a, b) => {
      const aTime = Math.max(...a.urls.map(url => new Date(url.createdAt).getTime()))
      const bTime = Math.max(...b.urls.map(url => new Date(url.createdAt).getTime()))
      return bTime - aTime
    })
  }, [urls])
} 