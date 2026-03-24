"use client"

import { useState, useCallback } from 'react'
import { SearchService, SearchResult } from '@/services/search.service'

const EMPTY_RESULTS: SearchResult = {
    foods: [],
    total: 0,
    query: '',
    cached: false
}

export function useSearch() {
    const [searchResults, setSearchResults] = useState<SearchResult>(EMPTY_RESULTS)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const searchFoods = useCallback(async (query: string, limit: number = 20) => {
        if (!query.trim()) {
            setSearchResults(EMPTY_RESULTS)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const result = await SearchService.searchFoods(query, limit)
            setSearchResults(result)
        } catch {
            setError('Failed to search foods')
            setSearchResults({ ...EMPTY_RESULTS, query })
        } finally {
            setLoading(false)
        }
    }, [])

    const clearResults = useCallback(() => {
        setSearchResults(EMPTY_RESULTS)
        setError(null)
    }, [])

    return {
        searchResults,
        loading,
        error,
        searchFoods,
        clearResults
    }
}
