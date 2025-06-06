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
    <div 
      className="w-full mb-6 rounded-t-lg rounded-b-lg overflow-hidden"
      style={{ backgroundColor: colors.cardBg, color: colors.cardFont }}
    >
      {data.title && (
        <div className="text-center p-4">
          <Link href={`/post/${firstPostId}`} className="hover:underline">
            <h2 className="mb-1">{data.title}</h2>
          </Link>
          <Link 
            href={`/${data.canonicalOwner.username}/${canonicalOwnerPostId}`} 
            className="meta-text hover:underline"
          >
            @{data.canonicalOwner.username}
          </Link>
        </div>
      )}
      
      {data.urls.map((urlData, index) => {
        // On front page, each URL gets its creator's colors; on user page, use page colors
        const urlColors = isFront ? {
          cardBg: urlData.post.owner.color1,
          cardFont: urlData.post.owner.color2
        } : colors;

        return (
          <div 
            key={urlData.id} 
            className="p-2"
            style={{ backgroundColor: urlColors.cardBg, color: urlColors.cardFont }}
          >
            <div className="flex items-start gap-3">
              <img 
                src={`https://www.google.com/s2/favicons?domain=${urlData.domain}`}
                alt=""
                className="w-8 h-8 flex-shrink-0 mt-1"
              />
              
              <div className="flex-1">
                <a 
                  href={urlData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:underline mb-1"
                >
                  {urlData.title || urlData.url}
                </a>
                
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/${urlData.post.owner.username}/${urlData.post.id}`}
                    className="hover:underline"
                    style={{ opacity: 1 }}
                  >
                    @{urlData.post.owner.username}
                  </Link>
                  <a 
                    href={urlData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline meta-text"
                  >
                    {urlData.domain}
                  </a>
                  <button
                    onClick={() => handleSave({
                      id: urlData.id,
                      url: urlData.url,
                      title: urlData.title,
                      domain: urlData.domain
                    })}
                    className={`hover:underline meta-text ${isSaved(urlData.id) ? 'underline' : ''}`}
                  >
                    {urlData.saves + (isSaved(urlData.id) ? 1 : 0)} saved
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )
} 