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
  createdAt: string
  owner: User
}

interface URLData {
  id: number
  url: string
  domain: string | null
  title: string | null
  description: string | null
  saves: number
  clicks: number
  createdAt: string
}

interface PostWithURLs {
  id: number
  title: string | null
  createdAt: string
  owner: User
  urls: URLData[]
}

// Extended URL format that includes post information for compatibility
export interface URLWithPost {
  id: number
  url: string
  domain: string | null
  title: string | null
  description: string | null
  saves: number
  clicks: number
  createdAt: string
  post: Post
}

export interface GroupedPost {
  title: string
  canonicalOwner: User   // first poster
  posts: Post[]          // all contributors incl. canonical
  urls: URLWithPost[]    // all URLs from all posts in this group, with post info
}

function slugify(str: string | null): string {
  if (!str) return ''
  return str.toLowerCase().trim()
}

export function useGroupedPosts(posts: PostWithURLs[] = []): GroupedPost[] {
  return useMemo(() => {
    const groupMap = new Map<string, GroupedPost>()
    
    // Group posts by their slugified title
    posts.forEach(post => {
      const postTitle = post.title || 'Untitled'
      const slugifiedTitle = slugify(postTitle)
      
      // Convert URLs to URLWithPost format
      const urlsWithPost: URLWithPost[] = post.urls.map(url => ({
        ...url,
        post: {
          id: post.id,
          title: post.title,
          createdAt: post.createdAt,
          owner: post.owner
        }
      }))
      
      if (!groupMap.has(slugifiedTitle)) {
        // Create new group with this post as canonical
        groupMap.set(slugifiedTitle, {
          title: postTitle,
          canonicalOwner: post.owner,
          posts: [{
            id: post.id,
            title: post.title,
            createdAt: post.createdAt,
            owner: post.owner
          }],
          urls: urlsWithPost
        })
      } else {
        // Add to existing group
        const group = groupMap.get(slugifiedTitle)!
        
        // Check if we've seen this post before in this group
        const existingPost = group.posts.find(p => p.id === post.id)
        if (!existingPost) {
          group.posts.push({
            id: post.id,
            title: post.title,
            createdAt: post.createdAt,
            owner: post.owner
          })
        }
        
        group.urls.push(...urlsWithPost)
      }
    })
    
    // Convert to array and sort by creation time (newest first)
    return Array.from(groupMap.values()).sort((a, b) => {
      const aTime = Math.max(...a.posts.map(post => new Date(post.createdAt).getTime()))
      const bTime = Math.max(...b.posts.map(post => new Date(post.createdAt).getTime()))
      return bTime - aTime
    })
  }, [posts])
} 