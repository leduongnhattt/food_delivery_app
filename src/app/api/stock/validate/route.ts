import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { StockValidationResult } from '@/lib/stock-validation'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { foodId, requestedQuantity } = body

        if (!foodId || !requestedQuantity) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const food = await prisma.food.findUnique({
            where: { FoodID: foodId },
            select: { FoodID: true, DishName: true, IsAvailable: true }
        })

        if (!food) {
            const result: StockValidationResult = {
                isValid: false,
                availableStock: 0,
                requestedQuantity,
                foodName: 'Unknown',
                message: 'Food item not found'
            }
            return NextResponse.json(result)
        }

        if (!food.IsAvailable) {
            const result: StockValidationResult = {
                isValid: false,
                availableStock: 0,
                requestedQuantity,
                foodName: food.DishName,
                message: 'This item is currently unavailable'
            }
            return NextResponse.json(result)
        }

        const result: StockValidationResult = {
            isValid: true,
            availableStock: Number.POSITIVE_INFINITY,
            requestedQuantity,
            foodName: food.DishName
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error validating stock:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
