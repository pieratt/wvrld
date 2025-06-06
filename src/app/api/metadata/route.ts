import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import ogs from 'open-graph-scraper'

const prisma = new PrismaClient()

interface OpenGraphResult {
  ogTitle?: string
  ogDescription?: string
  ogImage?: Array<{ url: string }> | { url: string }
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: Array<{ url: string }> | { url: string }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Find URLs with PENDING metadata status
    const pendingUrls = await prisma.uRL.findMany({
      where: {
        metadataStatus: 'PENDING'
      },
      take: 10, // Process 10 URLs at a time to avoid overwhelming external services
      orderBy: {
        createdAt: 'asc' // Process oldest first
      }
    })

    if (pendingUrls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending URLs to process',
        processed: 0
      })
    }

    let successCount = 0
    let failureCount = 0

    // Process each URL
    for (const urlRecord of pendingUrls) {
      try {
        const metadata = await fetchOpenGraphData(urlRecord.url)
        
        // Update the URL record with fetched metadata
        await prisma.uRL.update({
          where: { id: urlRecord.id },
          data: {
            title: metadata.title || null,
            description: metadata.description || null,
            image1: metadata.image || null,
            metadataStatus: 'SUCCESS',
            updatedAt: new Date()
          }
        })

        successCount++
        console.log(`✅ Successfully processed: ${urlRecord.url}`)
        
      } catch (error) {
        // Mark as failed and log error
        await prisma.uRL.update({
          where: { id: urlRecord.id },
          data: {
            metadataStatus: 'FAILED',
            updatedAt: new Date()
          }
        })

        failureCount++
        console.error(`❌ Failed to process ${urlRecord.url}:`, error)
      }

      // Add a small delay to be respectful to external services
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingUrls.length} URLs`,
      processed: pendingUrls.length,
      successful: successCount,
      failed: failureCount
    })

  } catch (error) {
    console.error('Metadata worker error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function fetchOpenGraphData(url: string): Promise<{
  title?: string
  description?: string
  image?: string
}> {
  try {
    const { result } = await ogs({ url, timeout: 5000 })
    
    // Extract and normalize data
    const title = result.ogTitle || result.twitterTitle || result.dcTitle
    const description = result.ogDescription || result.twitterDescription || result.dcDescription
    
    // Handle image data (can be array or single object)
    let image: string | undefined
    if (result.ogImage && Array.isArray(result.ogImage) && result.ogImage.length > 0) {
      image = result.ogImage[0].url
    } else if (result.ogImage && !Array.isArray(result.ogImage)) {
      image = (result.ogImage as any).url
    } else if (result.twitterImage && Array.isArray(result.twitterImage) && result.twitterImage.length > 0) {
      image = result.twitterImage[0].url
    } else if (result.twitterImage && !Array.isArray(result.twitterImage)) {
      image = (result.twitterImage as any).url
    }

    // Ensure image URLs are absolute
    if (image && !image.startsWith('http')) {
      try {
        const baseUrl = new URL(url)
        image = new URL(image, baseUrl.origin).toString()
      } catch {
        // If URL parsing fails, ignore the image
        image = undefined
      }
    }

    return {
      title: title || undefined,
      description: description || undefined,
      image: image || undefined
    }

  } catch (error) {
    throw new Error(`Failed to fetch OpenGraph data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Also support GET for manual testing
export async function GET(): Promise<NextResponse> {
  try {
    const pendingCount = await prisma.uRL.count({
      where: {
        metadataStatus: 'PENDING'
      }
    })

    const successCount = await prisma.uRL.count({
      where: {
        metadataStatus: 'SUCCESS'
      }
    })

    const failedCount = await prisma.uRL.count({
      where: {
        metadataStatus: 'FAILED'
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        pending: pendingCount,
        successful: successCount,
        failed: failedCount,
        total: pendingCount + successCount + failedCount
      }
    })

  } catch (error) {
    console.error('Metadata stats error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
} 