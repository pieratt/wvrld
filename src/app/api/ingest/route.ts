import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { parsePrompt } from '@/lib/parsePrompt'

const prisma = new PrismaClient()

export interface IngestRequest {
  rawText: string
  slug: string
  editing?: {
    type: 'user' | 'post'
    id?: number
  }
}

export interface IngestResponse {
  success: boolean
  data?: {
    userId: number
    postId?: number
    promptId?: number
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<IngestResponse>> {
  try {
    const body: IngestRequest = await request.json()
    
    if (!body.rawText || !body.slug) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: rawText and slug' },
        { status: 400 }
      )
    }

    // Validate slug format
    if (!/^[a-z0-9_-]{1,32}$/.test(body.slug)) {
      return NextResponse.json(
        { success: false, error: 'Invalid slug format. Must be 1-32 characters, lowercase letters, numbers, underscore, or dash only.' },
        { status: 400 }
      )
    }

    // Reserved slugs
    const reservedSlugs = ['api', 'static', 'admin', 'www', 'app', 'assets']
    if (reservedSlugs.includes(body.slug)) {
      return NextResponse.json(
        { success: false, error: 'Slug is reserved and cannot be used.' },
        { status: 400 }
      )
    }

    if (body.editing) {
      // Handle edit mode
      return await handleEdit(body)
    } else {
      // Handle create mode
      return await handleCreate(body)
    }
  } catch (error) {
    console.error('Ingest API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleCreate(body: IngestRequest): Promise<NextResponse<IngestResponse>> {
  // 1. Parse the prompt first to check for @username mentions
  const parsed = parsePrompt(body.rawText)

  // 2. Determine target users - use mentions if available, otherwise use bucket
  let targetUsernames: string[] = []
  
  if (parsed.mentions.length > 0) {
    // Use mentioned usernames
    targetUsernames = parsed.mentions
  } else {
    // Fall back to bucket slug
    targetUsernames = [body.slug]
  }

  // 3. Find or create all target users
  const targetUsers = []
  for (const username of targetUsernames) {
    // Validate username format (same as slug validation)
    if (!/^[a-z0-9_-]{1,32}$/.test(username)) {
      return NextResponse.json(
        { success: false, error: `Invalid username format: @${username}` },
        { status: 400 }
      )
    }

    let user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      // Create new user/bucket
      user = await prisma.user.create({
        data: {
          username,
          color1: generateRandomColor(),
          color2: generateRandomColor(),
          type: 'user'
        }
      })
    }
    targetUsers.push(user)
  }

  // 4. Create prompt record (using first target user)
  const prompt = await prisma.prompt.create({
    data: {
      rawText: body.rawText,
      userId: targetUsers[0].id
    }
  })

  // 5. Create posts for each target user
  const createdPosts = []
  for (const user of targetUsers) {
    const post = await prisma.post.create({
      data: {
        ownerId: user.id,
        promptId: prompt.id,
        title: parsed.title || null
      }
    })

    // Process URLs for this post
    if (parsed.urls.length > 0) {
      await processURLs(parsed.urls, post.id)
    }

    createdPosts.push(post)
  }

  return NextResponse.json({
    success: true,
    data: {
      userId: targetUsers[0].id,
      postId: createdPosts[0].id,
      promptId: prompt.id
    }
  })
}

async function handleEdit(body: IngestRequest): Promise<NextResponse<IngestResponse>> {
  if (body.editing!.type === 'user') {
    // Edit user/bucket profile
    const user = await prisma.user.findUnique({
      where: { username: body.slug }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // For user profiles, parse title and description differently
    const lines = body.rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    const title = lines.length > 0 ? lines[0] : null
    const description = lines.length > 1 ? lines[1] : null

    // Update user profile fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        title: title || null,
        description: description || null
      }
    })

    return NextResponse.json({
      success: true,
      data: { userId: user.id }
    })
  } else if (body.editing!.type === 'post') {
    // Edit existing post
    if (!body.editing!.id) {
      return NextResponse.json(
        { success: false, error: 'Post ID required for post editing' },
        { status: 400 }
      )
    }

    const post = await prisma.post.findUnique({
      where: { id: body.editing!.id },
      include: { owner: true }
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.owner.username !== body.slug) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Post does not belong to this bucket' },
        { status: 403 }
      )
    }

    // Parse new content
    const parsed = parsePrompt(body.rawText)

    // Update prompt if it exists
    if (post.promptId) {
      await prisma.prompt.update({
        where: { id: post.promptId },
        data: { rawText: body.rawText }
      })
    }

    // Update post title
    await prisma.post.update({
      where: { id: post.id },
      data: { title: parsed.title || null }
    })

    // Remove existing URLs
    await prisma.postURL.deleteMany({
      where: { postId: post.id }
    })

    // Add new URLs
    if (parsed.urls.length > 0) {
      await processURLs(parsed.urls, post.id)
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: post.ownerId,
        postId: post.id,
        promptId: post.promptId || undefined
      }
    })
  }

  return NextResponse.json(
    { success: false, error: 'Invalid edit type' },
    { status: 400 }
  )
}

async function processURLs(urls: string[], postId: number): Promise<void> {
  for (let i = 0; i < urls.length; i++) {
    const canonicalUrl = urls[i]
    
    // Upsert URL (find existing or create new)
    const url = await prisma.uRL.upsert({
      where: { url: canonicalUrl },
      update: {
        // Update metadata status to pending if not already processed
        metadataStatus: 'PENDING'
      },
      create: {
        url: canonicalUrl,
        domain: extractDomain(canonicalUrl),
        metadataStatus: 'PENDING'
      }
    })

    // Create PostURL relationship
    await prisma.postURL.create({
      data: {
        postId,
        urlId: url.id,
        order: i
      }
    })
  }

  // Trigger metadata processing asynchronously (don't wait for completion)
  // This ensures URLs don't stay in PENDING status
  if (urls.length > 0) {
    triggerMetadataProcessing().catch(error => {
      console.error('Background metadata processing failed:', error)
    })
  }
}

// Helper function to trigger metadata processing
async function triggerMetadataProcessing(): Promise<void> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    await fetch(`${baseUrl}/api/metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    // Silently fail - don't block the main request
    console.error('Failed to trigger metadata processing:', error)
  }
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    return 'unknown'
  }
}

function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
} 