import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface URLWithPost {
  id: number
  url: string
  domain: string | null
  title: string | null
  description: string | null
  image1: string | null
  saves: number
  clicks: number
  createdAt: string
  post: {
    id: number
    title: string | null
    owner: {
      id: number
      username: string
      title: string | null
      color1: string
      color2: string
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<URLWithPost[]>> {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')

    // Build the where clause
    const where = bucket 
      ? { post: { owner: { username: bucket } } }
      : {}

    const postURLs = await prisma.postURL.findMany({
      where,
      include: {
        url: true,
        post: {
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                title: true,
                color1: true,
                color2: true
              }
            }
          }
        }
      },
      orderBy: {
        post: {
          createdAt: 'desc'
        }
      }
    })

    // Transform the data to match our interface
    const urls: URLWithPost[] = postURLs.map(postURL => ({
      id: postURL.url.id,
      url: postURL.url.url,
      domain: postURL.url.domain,
      title: postURL.url.title,
      description: postURL.url.description,
      image1: postURL.url.image1,
      saves: postURL.url.saves,
      clicks: postURL.url.clicks,
      createdAt: postURL.url.createdAt.toISOString(),
      post: {
        id: postURL.post.id,
        title: postURL.post.title,
        owner: postURL.post.owner
      }
    }))

    return NextResponse.json(urls)
  } catch (error) {
    console.error('URLs API error:', error)
    return NextResponse.json(
      [],
      { status: 500 }
    )
  }
} 