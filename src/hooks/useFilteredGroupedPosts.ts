'use client'

import { useMemo } from 'react'
import { GroupedPost } from './useGroupedPosts'

export function useFilteredGroupedPosts(groupedPosts: GroupedPost[], selectedDomains: Set<string>): GroupedPost[] {
  return useMemo(() => {
    // If no filters are selected, return all posts
    if (!selectedDomains.size) {
      return groupedPosts
    }

    // Filter posts by only showing URLs that match the selected domains
    const filteredPosts = groupedPosts.map(group => {
      // Filter URLs to only include those with matching domains
      const filteredUrls = group.urls.filter(url => 
        url.domain && selectedDomains.has(url.domain)
      )

      // Only return the group if it has matching URLs
      if (filteredUrls.length === 0) {
        return null
      }

      // Return the group with only the filtered URLs
      return {
        ...group,
        urls: filteredUrls
      }
    }).filter((group): group is GroupedPost => group !== null)

    return filteredPosts
  }, [groupedPosts, selectedDomains])
} 