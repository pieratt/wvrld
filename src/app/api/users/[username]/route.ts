import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface UserWithStats {
  id: number
  username: string
  title: string | null
  description: string | null
  image1: string | null
  image2: string | null
  color1: string
  color2: string
  type: string | null
  createdAt: string
  stats: {
    totalPosts: number
    totalURLs: number
    uniqueDomains: number
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
): Promise<NextResponse<UserWithStats | { error: string }>> {
  try {
    const { username } = await params

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        posts: {
          include: {
            urls: {
              include: {
                url: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate stats
    const totalPosts = user.posts.length
    const allURLs = user.posts.flatMap(post => post.urls.map(postURL => postURL.url))
    const totalURLs = allURLs.length
    const uniqueDomains = new Set(allURLs.map(url => url.domain).filter(Boolean)).size

    const userWithStats: UserWithStats = {
      id: user.id,
      username: user.username,
      title: user.title,
      description: user.description,
      image1: user.image1,
      image2: user.image2,
      color1: user.color1,
      color2: user.color2,
      type: user.type,
      createdAt: user.createdAt.toISOString(),
      stats: {
        totalPosts,
        totalURLs,
        uniqueDomains
      }
    }

    return NextResponse.json(userWithStats)
  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 