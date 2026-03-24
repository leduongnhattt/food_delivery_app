import React from 'react'

interface HighlightTextProps {
  text: string
  searchQuery: string
  className?: string
}

export const HighlightText: React.FC<HighlightTextProps> = ({ 
  text, 
  searchQuery, 
  className = '' 
}) => {
  // Don't highlight if search query is the same as the text (exact match)
  if (text.toLowerCase() === searchQuery.toLowerCase()) {
    return <span className={className}>{text}</span>
  }

  // Don't highlight if search query is empty
  if (!searchQuery.trim()) {
    return <span className={className}>{text}</span>
  }

  // Split text by search query (case insensitive)
  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part matches the search query (case insensitive)
        const isMatch = part.toLowerCase() === searchQuery.toLowerCase()
        
        return isMatch ? (
          <mark 
            key={index} 
            className="bg-yellow-200 text-yellow-900"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      })}
    </span>
  )
}
