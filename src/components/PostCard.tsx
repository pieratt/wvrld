'use client'

import Link from 'next/link'
import { GroupedPost } from '@/hooks/useGroupedPosts'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'
import { palette } from '@/lib/palette'

type PostCardProps = {
  data: GroupedPost;
  isFront?: boolean;
  pageOwner?: any;
};

export default function PostCard({ data, isFront = false, pageOwner }: PostCardProps) {
  const { isSaved, toggleSave } = useSavedURLsContext()
  
  // Ensure canonical owner has all required properties for palette function
  const cardOwner = {
    ...data.canonicalOwner,
    type: null, // Add missing property
    description: null,
    image1: null,
    image2: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const colors = palette({
    cardOwner,
    isFront,
    pageOwner,
  })

  const handleSave = (url: { id: number; url: string; title: string | null; domain: string | null; }) => {
    toggleSave(url)
  }

  // Get the first post ID for the universal post link
  const firstPostId = data.posts[0]?.id;
  
  // Get the canonical owner's specific post ID
  const canonicalOwnerPostId = data.posts.find(post => post.owner.id === data.canonicalOwner.id)?.id;

  return (
    <section 
      className="post-card masonry-item"
      style={{ 
        '--c1': colors.cardBg, 
        '--c2': colors.cardFont 
      } as React.CSSProperties}
    >
      {data.title && (
        <header>
          <Link href={`/post/${firstPostId}`} className="hover:underline">
            <h3 className="post-title">{data.title}</h3>
          </Link>
          <Link 
            href={`/${data.canonicalOwner.username}/${canonicalOwnerPostId}`} 
            className="post-author hover:underline"
          >
            @{data.canonicalOwner.username}
          </Link>
        </header>
      )}
      
      {data.urls.map((urlData, index) => {
        // Each URL gets its owner's colors (the user who posted this specific URL)
        const urlOwner = {
          ...urlData.post.owner,
          type: null,
          description: null,
          image1: null,
          image2: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const urlColors = palette({
          cardOwner: urlOwner,
          isFront,
          pageOwner,
        });

        return (
          <div 
            key={urlData.id} 
            style={{
              '--c1': urlColors.cardBg,
              '--c2': urlColors.cardFont,
              backgroundColor: 'var(--c1)',
              color: 'var(--c2)',
              padding: '0.5rem'
            } as React.CSSProperties}
          >
            <div className="url-row">
              <img 
                src={`https://www.google.com/s2/favicons?domain=${urlData.domain}`}
                alt=""
                className="ico"
              />
              <div>
                <div>
                  <a 
                    href={urlData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="meta-link"
                  >
                    {urlData.title || urlData.url}
                  </a>
                </div>
                <div>
                  <a 
                    href={urlData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="meta-link"
                  >
                    {urlData.domain}
                  </a>{' '}
                  <Link 
                    href={`/${urlData.post.owner.username}/${urlData.post.id}`}
                    className="meta-link"
                  >
                    @{urlData.post.owner.username}
                  </Link>{' '}
                  <button
                    onClick={() => handleSave({
                      id: urlData.id,
                      url: urlData.url,
                      title: urlData.title,
                      domain: urlData.domain
                    })}
                    className={`meta-link${isSaved(urlData.id) ? ' saved' : ''}`}
                  >
                    {urlData.saves + (isSaved(urlData.id) ? 1 : 0)} saved
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  )
} 