import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface PostWithURLs {
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
    saves: number
    clicks: number
    createdAt: string
  }>
}

export async function GET(request: NextRequest): Promise<NextResponse<PostWithURLs[]>> {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')

    // Build the where clause
    const where = bucket 
      ? { owner: { username: bucket } }
      : {}

    const posts = await prisma.post.findMany({
      where,
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
        urls: {
          include: {
            url: {
              select: {
                id: true,
                url: true,
                title: true,
                description: true,
                domain: true,
                saves: true,
                clicks: true,
                createdAt: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match our interface
    const postsWithURLs: PostWithURLs[] = posts.map(post => ({
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
        saves: postUrl.url.saves,
        clicks: postUrl.url.clicks,
        createdAt: postUrl.url.createdAt.toISOString()
      }))
    }))

    return NextResponse.json(postsWithURLs)
  } catch (error) {
    console.error('Posts API error:', error)
    return NextResponse.json(
      [],
      { status: 500 }
    )
  }
} 