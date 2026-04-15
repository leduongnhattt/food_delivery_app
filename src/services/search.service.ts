import { Food } from '@/types/models'
import { requestJson } from '@/lib/http-client'
import { API_BASE_URL } from '@/services/api'

export interface SearchResult {
    foods: Food[]
    total: number
    query: string
    cached: boolean
}

const EMPTY_RESULT = (query: string): SearchResult => ({
    foods: [],
    total: 0,
    query,
    cached: false
})

function getFoodsSearchUrl(query: string, limit: number): string {
    const basePath = `${API_BASE_URL}/foods/search`

    const params = new URLSearchParams()
    params.set('q', query)
    params.set('limit', String(limit))

    return `${basePath}?${params.toString()}`
}

export class SearchService {
    static async searchFoods(query: string, limit: number = 20): Promise<SearchResult> {
        try {
            const url = getFoodsSearchUrl(query, limit)
            return await requestJson<SearchResult>(url, {
                method: 'GET',
                cache: 'no-store'
            })
        } catch {
            return EMPTY_RESULT(query)
        }
    }
}
