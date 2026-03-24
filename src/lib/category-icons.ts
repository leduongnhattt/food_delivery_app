export const CATEGORY_ICON_MAP: Record<string, string> = {
    Pizza: '🍕', Sushi: '🍣', Pho: '🍜', Burger: '🍔', Salad: '🥗', Dessert: '🍰',
    Drinks: '🥤', Coffee: '☕', Chicken: '🍗', Pasta: '🍝', 'Hot Pot': '🍲', Sandwich: '🥖'
}

export const CATEGORY_TONE_MAP: Record<string, string> = {
    Pizza: 'bg-red-50 text-red-700 border-red-100',
    Sushi: 'bg-blue-50 text-blue-700 border-blue-100',
    Pho: 'bg-orange-50 text-orange-700 border-orange-100',
    Burger: 'bg-amber-50 text-amber-700 border-amber-100',
    Salad: 'bg-green-50 text-green-700 border-green-100',
    Dessert: 'bg-pink-50 text-pink-700 border-pink-100',
    Drinks: 'bg-purple-50 text-purple-700 border-purple-100',
    Coffee: 'bg-stone-50 text-stone-700 border-stone-100',
    Chicken: 'bg-orange-50 text-orange-700 border-orange-100',
    Pasta: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    'Hot Pot': 'bg-red-50 text-red-700 border-red-100',
    Sandwich: 'bg-amber-50 text-amber-700 border-amber-100',
}

function normalize(name: string): string {
    return (name || '').trim()
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getCategoryIcon(name: string, fallback = '🍽️'): string {
    const key = normalize(name)
    return CATEGORY_ICON_MAP[key] ?? fallback
}

export function getCategoryTone(name: string, fallback = 'bg-gray-50 text-gray-700 border-gray-100'): string {
    const key = normalize(name)
    return CATEGORY_TONE_MAP[key] ?? fallback
}
