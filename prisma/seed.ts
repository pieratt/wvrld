import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create system user (User 1)
  const systemUser = await prisma.user.upsert({
    where: { username: 'system' },
    update: {},
    create: {
      username: 'system',
      title: 'System',
      type: 'system',
      color1: '#000000',
      color2: '#ffffff',
    },
  })

  // Create Anonymous user (User 2) for front-page posts
  const anonymousUser = await prisma.user.upsert({
    where: { username: 'anonymous' },
    update: {},
    create: {
      username: 'anonymous',
      title: 'Anonymous',
      description: 'Front page community posts',
      color1: '#6366f1',
      color2: '#8b5cf6',
    },
  })

  // Create sample user buckets
  const alice = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: {
      username: 'alice',
      title: 'Alice\'s Collection',
      description: 'Curated links and discoveries',
      color1: '#ef4444',
      color2: '#f97316',
    },
  })

  const bob = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: {
      username: 'bob',
      title: 'Bob\'s Tech Stack',
      description: 'Development tools and resources',
      color1: '#10b981',
      color2: '#06b6d4',
    },
  })

  // Create sample URLs
  const urls = await Promise.all([
    prisma.uRL.upsert({
      where: { url: 'https://github.com/vercel/next.js' },
      update: {},
      create: {
        url: 'https://github.com/vercel/next.js',
        domain: 'github.com',
        title: 'Next.js - The React Framework',
        description: 'The React Framework for the Web',
      },
    }),
    prisma.uRL.upsert({
      where: { url: 'https://tailwindcss.com' },
      update: {},
      create: {
        url: 'https://tailwindcss.com',
        domain: 'tailwindcss.com',
        title: 'Tailwind CSS',
        description: 'A utility-first CSS framework',
      },
    }),
    prisma.uRL.upsert({
      where: { url: 'https://www.prisma.io' },
      update: {},
      create: {
        url: 'https://www.prisma.io',
        domain: 'prisma.io',
        title: 'Prisma',
        description: 'Next-generation Node.js and TypeScript ORM',
      },
    }),
    prisma.uRL.upsert({
      where: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      update: {},
      create: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        domain: 'youtube.com',
        title: 'Rick Astley - Never Gonna Give You Up',
        description: 'The official video for Rick Astley',
      },
    }),
    prisma.uRL.upsert({
      where: { url: 'https://example.com/article' },
      update: {},
      create: {
        url: 'https://example.com/article',
        domain: 'example.com',
        title: 'Sample Article',
        description: 'A sample article for testing',
      },
    }),
    prisma.uRL.upsert({
      where: { url: 'https://news.ycombinator.com' },
      update: {},
      create: {
        url: 'https://news.ycombinator.com',
        domain: 'news.ycombinator.com',
        title: 'Hacker News',
        description: 'Social news website focusing on computer science',
      },
    }),
  ])

  // Create sample prompts and posts
  const prompt1 = await prisma.prompt.create({
    data: {
      rawText: 'My favorite development tools\nhttps://github.com/vercel/next.js\nhttps://tailwindcss.com\nhttps://www.prisma.io',
      userId: bob.id,
    },
  })

  const post1 = await prisma.post.create({
    data: {
      title: 'My favorite development tools',
      ownerId: bob.id,
      promptId: prompt1.id,
    },
  })

  // Link URLs to post1
  await Promise.all([
    prisma.postURL.create({
      data: {
        postId: post1.id,
        urlId: urls[0].id, // Next.js
        order: 1,
      },
    }),
    prisma.postURL.create({
      data: {
        postId: post1.id,
        urlId: urls[1].id, // Tailwind
        order: 2,
      },
    }),
    prisma.postURL.create({
      data: {
        postId: post1.id,
        urlId: urls[2].id, // Prisma
        order: 3,
      },
    }),
  ])

  const prompt2 = await prisma.prompt.create({
    data: {
      rawText: 'Random interesting links\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ\nhttps://example.com/article',
      userId: alice.id,
    },
  })

  const post2 = await prisma.post.create({
    data: {
      title: 'Random interesting links',
      ownerId: alice.id,
      promptId: prompt2.id,
    },
  })

  // Link URLs to post2
  await Promise.all([
    prisma.postURL.create({
      data: {
        postId: post2.id,
        urlId: urls[3].id, // YouTube
        order: 1,
      },
    }),
    prisma.postURL.create({
      data: {
        postId: post2.id,
        urlId: urls[4].id, // Example article
        order: 2,
      },
    }),
  ])

  // Create an anonymous front-page post
  const prompt3 = await prisma.prompt.create({
    data: {
      rawText: 'https://news.ycombinator.com',
      userId: anonymousUser.id,
    },
  })

  const post3 = await prisma.post.create({
    data: {
      ownerId: anonymousUser.id,
      promptId: prompt3.id,
    },
  })

  await prisma.postURL.create({
    data: {
      postId: post3.id,
      urlId: urls[5].id, // Hacker News
      order: 1,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`Created users: ${systemUser.username}, ${anonymousUser.username}, ${alice.username}, ${bob.username}`)
  console.log(`Created ${urls.length} URLs and 3 posts`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  }) 