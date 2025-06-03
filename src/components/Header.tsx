import Link from 'next/link'
import { MockUser } from '@/lib/mockData'

interface HeaderProps {
  currentBucket?: MockUser | null
  showAddButton?: boolean
}

export default function Header({ currentBucket, showAddButton = true }: HeaderProps) {
  const gradientStyle = currentBucket ? {
    background: `linear-gradient(135deg, ${currentBucket.color1}, ${currentBucket.color2})`
  } : undefined

  return (
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
            {showAddButton && (
              <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
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
  )
} 