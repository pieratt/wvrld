// Mock data for static UI development
// Matches our Prisma schema structure

export interface MockUser {
  id: number
  username: string
  title: string | null
  description: string | null
  color1: string
  color2: string
  type: string | null
}

export interface MockURL {
  id: number
  url: string
  domain: string | null
  title: string | null
  description: string | null
  image1: string | null
  saves: number
  clicks: number
}

export interface MockPost {
  id: number
  title: string | null
  createdAt: string
  owner: MockUser
  urls: Array<{
    url: MockURL
    order: number | null
    comment: string | null
  }>
}

export const mockUsers: MockUser[] = [
  {
    id: 1,
    username: 'system',
    title: 'System',
    description: null,
    color1: '#000000',
    color2: '#ffffff',
    type: 'system'
  },
  {
    id: 2,
    username: 'anonymous',
    title: 'Anonymous',
    description: 'Front page community posts',
    color1: '#6366f1',
    color2: '#8b5cf6',
    type: null
  },
  {
    id: 3,
    username: 'alice',
    title: "Alice's Collection",
    description: 'Curated links and discoveries',
    color1: '#ef4444',
    color2: '#f97316',
    type: null
  },
  {
    id: 4,
    username: 'bob',
    title: "Bob's Tech Stack",
    description: 'Development tools and resources',
    color1: '#10b981',
    color2: '#06b6d4',
    type: null
  }
]

export const mockURLs: MockURL[] = [
  {
    id: 1,
    url: 'https://github.com/vercel/next.js',
    domain: 'github.com',
    title: 'Next.js - The React Framework',
    description: 'The React Framework for the Web',
    image1: null,
    saves: 42,
    clicks: 156
  },
  {
    id: 2,
    url: 'https://tailwindcss.com',
    domain: 'tailwindcss.com',
    title: 'Tailwind CSS',
    description: 'A utility-first CSS framework',
    image1: null,
    saves: 38,
    clicks: 124
  },
  {
    id: 3,
    url: 'https://www.prisma.io',
    domain: 'prisma.io',
    title: 'Prisma',
    description: 'Next-generation Node.js and TypeScript ORM',
    image1: null,
    saves: 29,
    clicks: 87
  },
  {
    id: 4,
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    domain: 'youtube.com',
    title: 'Rick Astley - Never Gonna Give You Up',
    description: 'The official video for Rick Astley',
    image1: null,
    saves: 1337,
    clicks: 9999
  },
  {
    id: 5,
    url: 'https://example.com/article',
    domain: 'example.com',
    title: 'Sample Article',
    description: 'A sample article for testing',
    image1: null,
    saves: 5,
    clicks: 23
  },
  {
    id: 6,
    url: 'https://news.ycombinator.com',
    domain: 'news.ycombinator.com',
    title: 'Hacker News',
    description: 'Social news website focusing on computer science',
    image1: null,
    saves: 67,
    clicks: 234
  },
  {
    id: 7,
    url: 'https://www.figma.com',
    domain: 'figma.com',
    title: 'Figma',
    description: 'The collaborative interface design tool',
    image1: null,
    saves: 45,
    clicks: 178
  },
  {
    id: 8,
    url: 'https://linear.app',
    domain: 'linear.app',
    title: 'Linear',
    description: 'The issue tracking tool you\'ll enjoy using',
    image1: null,
    saves: 32,
    clicks: 98
  },
  {
    id: 9,
    url: 'https://www.notion.so',
    domain: 'notion.so',
    title: 'Notion',
    description: 'One workspace. Every team.',
    image1: null,
    saves: 89,
    clicks: 456
  },
  {
    id: 10,
    url: 'https://vercel.com',
    domain: 'vercel.com',
    title: 'Vercel',
    description: 'Develop. Preview. Ship.',
    image1: null,
    saves: 56,
    clicks: 189
  }
]

export const mockPosts: MockPost[] = [
  {
    id: 1,
    title: 'My favorite development tools',
    createdAt: '2024-01-15T10:30:00Z',
    owner: mockUsers[3], // Bob
    urls: [
      { url: mockURLs[0], order: 1, comment: null }, // Next.js
      { url: mockURLs[1], order: 2, comment: null }, // Tailwind
      { url: mockURLs[2], order: 3, comment: null }  // Prisma
    ]
  },
  {
    id: 2,
    title: 'Random interesting links',
    createdAt: '2024-01-14T15:45:00Z',
    owner: mockUsers[2], // Alice
    urls: [
      { url: mockURLs[3], order: 1, comment: null }, // YouTube
      { url: mockURLs[4], order: 2, comment: null }  // Example
    ]
  },
  {
    id: 3,
    title: null,
    createdAt: '2024-01-13T09:15:00Z',
    owner: mockUsers[1], // Anonymous
    urls: [
      { url: mockURLs[5], order: 1, comment: null }  // Hacker News
    ]
  },
  {
    id: 4,
    title: 'Design workflow essentials',
    createdAt: '2024-01-12T14:20:00Z',
    owner: mockUsers[2], // Alice
    urls: [
      { url: mockURLs[6], order: 1, comment: null }, // Figma
      { url: mockURLs[7], order: 2, comment: null }, // Linear
      { url: mockURLs[8], order: 3, comment: null }  // Notion
    ]
  },
  {
    id: 5,
    title: 'Deployment made easy',
    createdAt: '2024-01-11T11:00:00Z',
    owner: mockUsers[3], // Bob
    urls: [
      { url: mockURLs[9], order: 1, comment: null }  // Vercel
    ]
  }
]

// Helper function to get all URLs from all posts (for front page)
export const getAllURLs = (): Array<{ url: MockURL; post: MockPost; owner: MockUser }> => {
  const allURLs: Array<{ url: MockURL; post: MockPost; owner: MockUser }> = []
  
  mockPosts.forEach(post => {
    post.urls.forEach(({ url }) => {
      allURLs.push({
        url,
        post,
        owner: post.owner
      })
    })
  })
  
  return allURLs
}

// Helper function to get URLs for a specific bucket
export const getURLsForBucket = (username: string): Array<{ url: MockURL; post: MockPost; owner: MockUser }> => {
  const bucketURLs: Array<{ url: MockURL; post: MockPost; owner: MockUser }> = []
  
  mockPosts
    .filter(post => post.owner.username === username)
    .forEach(post => {
      post.urls.forEach(({ url }) => {
        bucketURLs.push({
          url,
          post,
          owner: post.owner
        })
      })
    })
  
  return bucketURLs
} 