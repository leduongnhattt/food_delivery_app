import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'

const CACHE_TTL = 300 // 5 minutes
const DEFAULT_LIMIT = 20

const transformFood = (food: any) => ({
    foodId: food.FoodID,
    dishName: food.DishName,
    description: food.Description || '',
    price: Number(food.Price),
    stock: food.Stock || 0,
    imageUrl: food.ImageURL || '/images/default-food.jpg',
    restaurantId: food.EnterpriseID,
    menu: {
        menuId: food.FoodID,
        category: food.foodCategory?.CategoryName || 'Food'
    },
    enterprise: food.enterprise ? {
        EnterpriseID: food.enterprise.EnterpriseID,
        EnterpriseName: food.enterprise.EnterpriseName
    } : null
})

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const query = searchParams.get('q') || ''
        const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT))

        if (!query.trim()) {
            return NextResponse.json({
                foods: [],
                total: 0,
                query: '',
                cached: false
            })
        }

        const cacheKey = `food_search:${query.toLowerCase()}:${limit}`
        const cached = await redis.get(cacheKey)

        if (cached) {
            return NextResponse.json(JSON.parse(cached))
        }

        const foods = await prisma.food.findMany({
            where: {
                OR: [
                    { DishName: { contains: query } },
                    {
                        foodCategory: {
                            CategoryName: { contains: query }
                        }
                    }
                ],
                IsAvailable: true
            },
            include: {
                enterprise: {
                    select: {
                        EnterpriseName: true,
                        EnterpriseID: true
                    }
                },
                foodCategory: {
                    select: {
                        CategoryName: true
                    }
                }
            },
            take: limit,
            orderBy: { DishName: 'asc' }
        })

        const transformedFoods = foods.map(transformFood)
        const result = {
            foods: transformedFoods,
            total: transformedFoods.length,
            query,
            cached: false
        }

        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result))
        return NextResponse.json(result)
    } catch {
        return NextResponse.json(
            { error: 'Internal server error', foods: [], total: 0 },
            { status: 500 }
        )
    }
}
