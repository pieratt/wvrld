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
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UserWithStats | { error: string }>> {
  try {
    const { id } = await params
    const userId = parseInt(id, 10)

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    const { id } = await params
    const userId = parseInt(id, 10)

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { color1, color2 } = body

    // Validate hex colors
    const hexColorRegex = /^#[0-9A-F]{6}$/i
    if (color1 && !hexColorRegex.test(color1)) {
      return NextResponse.json(
        { error: 'Invalid color1 format. Must be hex format like #FF0000' },
        { status: 400 }
      )
    }
    if (color2 && !hexColorRegex.test(color2)) {
      return NextResponse.json(
        { error: 'Invalid color2 format. Must be hex format like #FF0000' },
        { status: 400 }
      )
    }

    // Update user colors
    const updateData: { color1?: string; color2?: string } = {}
    if (color1) updateData.color1 = color1
    if (color2) updateData.color2 = color2

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('User color update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 