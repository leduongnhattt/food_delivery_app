export interface StockValidationResult {
    isValid: boolean
    availableStock: number
    requestedQuantity: number
    foodName: string
    message?: string
}

/**
 * Check if a single food item has sufficient stock (client-side)
 */
export async function validateFoodStock(
    foodId: string,
    requestedQuantity: number
): Promise<StockValidationResult> {
    try {
        const response = await fetch('/api/stock/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                foodId,
                requestedQuantity
            })
        })

        if (!response.ok) {
            throw new Error('Failed to validate stock')
        }

        const result = await response.json()
        return result
    } catch (error) {
        console.error('Error validating food stock:', error)
        return {
            isValid: false,
            availableStock: 0,
            requestedQuantity,
            foodName: 'Unknown',
            message: 'Error checking stock availability'
        }
    }
}
