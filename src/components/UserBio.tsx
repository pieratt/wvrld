'use client'

import Link from 'next/link'

interface UserBioProps {
  title: string | null
  username: string
  description: string | null
  stats: {
    totalPosts: number
    totalURLs: number
    uniqueDomains: number
  }
  showEditLink?: boolean
}

export function UserBio({ title, username, description, stats, showEditLink = true }: UserBioProps) {
  return (
    <div className="space-y-2 mb-6">
      <h1 className="post-title text-xl font-medium leading-tight">
        {title || username}
      </h1>
      {description && (
        <p className="post-title text-xl font-medium leading-tight">
          {description}
        </p>
      )}
      <div className="meta-text flex gap-4">
        <span>{stats.totalURLs} URLs</span>
        <span>{stats.uniqueDomains} domains</span>
        <span>{stats.totalPosts} posts</span>
      </div>
      {showEditLink && (
        <Link href={`/${username}/edit`} className="hover:underline">
          edit bucket
        </Link>
      )}
    </div>
  )
} 