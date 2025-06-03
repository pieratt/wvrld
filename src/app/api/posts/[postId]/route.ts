import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface PostWithDetails {
  id: number
  title: string | null
  createdAt: string
  owner: {
    id: number
    username: string
    title: string | null
    color1: string
    color2: string
  }
  urls: Array<{
    id: number
    url: string
    title: string | null
    description: string | null
    domain: string | null
    order: number | null
  }>
  prompt?: {
    rawText: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
): Promise<NextResponse<PostWithDetails | { error: string }>> {
  try {
    const { postId } = await params
    const postIdNum = parseInt(postId, 10)

    if (isNaN(postIdNum)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      )
    }

    const post = await prisma.post.findUnique({
      where: { id: postIdNum },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            title: true,
            color1: true,
            color2: true
          }
        },
        prompt: {
          select: {
            rawText: true
          }
        },
        urls: {
          include: {
            url: {
              select: {
                id: true,
                url: true,
                title: true,
                description: true,
                domain: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const response: PostWithDetails = {
      id: post.id,
      title: post.title,
      createdAt: post.createdAt.toISOString(),
      owner: post.owner,
      urls: post.urls.map(postUrl => ({
        id: postUrl.url.id,
        url: postUrl.url.url,
        title: postUrl.url.title,
        description: postUrl.url.description,
        domain: postUrl.url.domain,
        order: postUrl.order
      })),
      prompt: post.prompt || undefined
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Posts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 