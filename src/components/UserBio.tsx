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
      <h1 className="type-large">
        {title || username}
      </h1>
      {description && (
        <p className="type-large">
          {description}
        </p>
      )}
      <div className="type-small state-inactive flex gap-4">
        <span>{stats.totalURLs} URLs</span>
        <span>{stats.uniqueDomains} domains</span>
        <span>{stats.totalPosts} posts</span>
      </div>
      {showEditLink && (
        <Link href={`/${username}/edit`} className="type-small hover:underline">
          edit bucket
        </Link>
      )}
    </div>
  )
} 