import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create system user (Anonymous - userId 2 as specified in plan)
  const anonymous = await prisma.user.upsert({
    where: { username: 'anonymous' },
    update: {},
    create: {
      id: 2,
      username: 'anonymous',
      title: 'Anonymous',
      description: 'Community shared links',
      color1: '#6366F1',
      color2: '#8B5CF6',
      type: 'system'
    }
  })

  // Create sample users
  const alice = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: {
      username: 'alice',
      title: 'Alice\'s Design Resources',
      description: 'Curated design tools and inspiration',
      color1: '#F59E0B',
      color2: '#EF4444',
      type: 'user'
    }
  })

  const bob = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: {
      username: 'bob',
      title: 'Bob\'s Dev Stack',
      description: 'Development tools and resources',
      color1: '#10B981',
      color2: '#3B82F6',
      type: 'user'
    }
  })

  const charlie = await prisma.user.upsert({
    where: { username: 'charlie' },
    update: {},
    create: {
      username: 'charlie',
      title: 'Charlie\'s Music Collection',
      description: 'Discovering new sounds',
      color1: '#8B5CF6',
      color2: '#EC4899',
      type: 'user'
    }
  })

  // Create sample posts with URLs
  const posts = [
    {
      user: alice,
      title: 'Essential Design Tools',
      urls: [
        'https://figma.com',
        'https://dribbble.com',
        'https://behance.net'
      ]
    },
    {
      user: alice,
      title: null, // URLs-only post
      urls: [
        'https://coolors.co',
        'https://unsplash.com'
      ]
    },
    {
      user: bob,
      title: 'My Development Setup',
      urls: [
        'https://github.com',
        'https://stackoverflow.com',
        'https://vercel.com'
      ]
    },
    {
      user: bob,
      title: 'Learning Resources',
      urls: [
        'https://developer.mozilla.org',
        'https://typescript.org'
      ]
    },
    {
      user: charlie,
      title: 'Current Playlist',
      urls: [
        'https://spotify.com',
        'https://bandcamp.com',
        'https://soundcloud.com'
      ]
    },
    {
      user: anonymous,
      title: 'Community Favorites',
      urls: [
        'https://reddit.com',
        'https://hackernews.com',
        'https://producthunt.com'
      ]
    }
  ]

  for (const postData of posts) {
    // Create prompt
    const rawText = postData.title 
      ? `${postData.title}\n${postData.urls.join('\n')}`
      : postData.urls.join('\n')

    const prompt = await prisma.prompt.create({
      data: {
        rawText,
        userId: postData.user.id
      }
    })

    // Create post
    const post = await prisma.post.create({
      data: {
        ownerId: postData.user.id,
        promptId: prompt.id,
        title: postData.title
      }
    })

    // Create URLs and relationships
    for (let i = 0; i < postData.urls.length; i++) {
      const urlString = postData.urls[i]
      
      // Extract domain
      const domain = new URL(urlString).hostname

      // Upsert URL
      const url = await prisma.uRL.upsert({
        where: { url: urlString },
        update: {},
        create: {
          url: urlString,
          domain,
          title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} - Great Resource`,
          description: `Discover amazing content on ${domain}`,
          metadataStatus: 'SUCCESS'
        }
      })

      // Create PostURL relationship
      await prisma.postURL.create({
        data: {
          postId: post.id,
          urlId: url.id,
          order: i
        }
      })
    }
  }

  console.log('✅ Database seeded successfully!')
  console.log(`Created ${posts.length} posts across 4 users`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 