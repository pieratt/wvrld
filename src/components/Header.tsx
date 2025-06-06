'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MockUser } from '@/lib/mockData'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'
import AddURLModal from './AddURLModal'

interface HeaderProps {
  currentBucket?: MockUser | null
  showAddButton?: boolean
}

export default function Header({ currentBucket, showAddButton = true }: HeaderProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const { totalSaved } = useSavedURLsContext()
  
  const gradientStyle = currentBucket ? {
    background: `linear-gradient(135deg, ${currentBucket.color1}, ${currentBucket.color2})`
  } : undefined

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and current bucket */}
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:opacity-80 transition-opacity">
                WVRLD
              </Link>
              
              {currentBucket && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">/</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={gradientStyle}
                    />
                    <div>
                      <h1 className="font-semibold text-gray-900">
                        {currentBucket.title || currentBucket.username}
                      </h1>
                      {currentBucket.description && (
                        <p className="text-xs text-gray-600">
                          {currentBucket.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link 
                href="/saved"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors flex items-center gap-1"
              >
                Saved{totalSaved > 0 && ` (${totalSaved})`}
              </Link>
              
              {showAddButton && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Add URLs
                </button>
              )}
              
              {currentBucket && (
                <Link 
                  href={`/${currentBucket.username}/edit`}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  Edit
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Add URL Modal */}
      {showAddModal && (
        <AddURLModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          bucketSlug={currentBucket?.username || 'anonymous'}
        />
      )}
    </>
  )
} 