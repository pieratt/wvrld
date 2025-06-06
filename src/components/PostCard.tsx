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

  return (
    <div 
      className="w-full mb-6 p-4"
      style={{ backgroundColor: colors.cardBg, color: colors.cardFont }}
    >
      {data.title && (
        <div className="text-center mb-4">
          <h2 className="mb-1">{data.title}</h2>
          <div className="meta-text">@{data.canonicalOwner.username}</div>
        </div>
      )}
      
      {data.urls.map((urlData) => {
        // On front page, each URL gets its creator's colors; on user page, use page colors
        const urlColors = isFront ? {
          cardBg: urlData.post.owner.color1,
          cardFont: urlData.post.owner.color2
        } : colors;

        return (
          <div 
            key={urlData.id} 
            className="mb-4 last:mb-0 p-2"
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
                
                <div className="meta-text flex items-center gap-2">
                  <a 
                    href={urlData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {urlData.domain}
                  </a>
                  <Link 
                    href={`/${urlData.post.owner.username}`}
                    className="hover:underline"
                  >
                    @{urlData.post.owner.username}
                  </Link>
                  <button
                    onClick={() => handleSave({
                      id: urlData.id,
                      url: urlData.url,
                      title: urlData.title,
                      domain: urlData.domain
                    })}
                    className={`hover:underline ${isSaved(urlData.id) ? 'underline' : ''}`}
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