'use client'

import React from 'react'
import { notFound } from 'next/navigation'
import { palette } from '@/lib/palette'
import useSWR from 'swr'
import { UserWithStats } from '../../api/users/[username]/route'
import { PostWithDetails } from '../../api/posts/[postId]/route'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import PostCard from '@/components/PostCard'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PostPageProps {
  params: Promise<{ slug: string; postId: string }>
}

export default function PostPage({ params }: PostPageProps) {
  const { slug, postId } = React.use(params)
  
  const { data: user, error: userError } = useSWR<UserWithStats>(`/api/users/${slug}`, fetcher)
  const { data: post, error: postError } = useSWR<PostWithDetails>(`/api/posts/${postId}`, fetcher)

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

  // Convert post data to GroupedPost format for PostCard
  const groupedPost = {
    canonicalOwner: pageOwner,
    title: post.title || 'Untitled',
    posts: [{
      id: post.id,
      title: post.title,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: pageOwner
    }],
    urls: post.urls.map((url: any) => ({
      ...url,
      post: {
        id: post.id,
        title: post.title,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: pageOwner
      }
    }))
  }

  const sidebar = (
    <div className="space-y-2">
      <Link href={`/${slug}`} className="hover:underline">
        ← {user.title || user.username}
      </Link>
      
      <div className="meta-text">
        <div>Post #{post.id}</div>
        <div>{post.urls.length} URLs</div>
      </div>
      
      <Link href={`/${slug}/${postId}/edit`} className="hover:underline">
        edit post
      </Link>
    </div>
  )

  return (
    <PageLayout
      style={{
        '--c1': colors.pageFont,
        '--c2': colors.pageBg,
        backgroundColor: 'var(--c2)',
        color: 'var(--c1)',
        minHeight: '100vh',
      } as React.CSSProperties}
      sidebar={sidebar}
    >
      <PostCard
        data={groupedPost}
        isFront={false}
        pageOwner={pageOwner}
      />
    </PageLayout>
  )
} 