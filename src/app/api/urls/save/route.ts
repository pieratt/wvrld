import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SaveRequest {
  urlId: number
  action: 'save' | 'unsave'
}

export interface SaveResponse {
  success: boolean
  newSaveCount?: number
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<SaveResponse>> {
  try {
    const body: SaveRequest = await request.json()
    
    if (!body.urlId || !body.action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: urlId and action' },
        { status: 400 }
      )
    }

    if (body.action !== 'save' && body.action !== 'unsave') {
      return NextResponse.json(
        { success: false, error: 'Action must be either "save" or "unsave"' },
        { status: 400 }
      )
    }

    // Check if URL exists
    const url = await prisma.uRL.findUnique({
      where: { id: body.urlId }
    })

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL not found' },
        { status: 404 }
      )
    }

    // Update save count
    const increment = body.action === 'save' ? 1 : -1
    const updatedURL = await prisma.uRL.update({
      where: { id: body.urlId },
      data: {
        saves: {
          increment: increment
        }
      }
    })

    // Ensure save count doesn't go below 0
    if (updatedURL.saves < 0) {
      await prisma.uRL.update({
        where: { id: body.urlId },
        data: { saves: 0 }
      })
      updatedURL.saves = 0
    }

    return NextResponse.json({
      success: true,
      newSaveCount: updatedURL.saves
    })
  } catch (error) {
    console.error('Save API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 