import { Food } from '@/types/models'
import { requestJson } from '@/lib/http-client'

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

export class SearchService {
    static async searchFoods(query: string, limit: number = 20): Promise<SearchResult> {
        try {
            const url = `/api/foods/search?q=${encodeURIComponent(query)}&limit=${limit}`
            return await requestJson<SearchResult>(url, {
                method: 'GET',
                cache: 'no-store'
            })
        } catch {
            return EMPTY_RESULT(query)
        }
    }
}
