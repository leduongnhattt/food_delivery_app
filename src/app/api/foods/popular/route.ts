import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma'
import { retryDatabaseOperation } from '@/lib/retry-utils'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '10')
        const page = parseInt(searchParams.get('page') || '1')
        const restaurantId = searchParams.get('restaurantId')
        const category = searchParams.get('category')
        const search = searchParams.get('search')
        const isAvailable = searchParams.get('isAvailable')

        // Validate parameters
        if (limit < 1 || limit > 100) {
            return NextResponse.json(
                { error: 'Limit must be between 1 and 100' },
                { status: 400 }
            )
        }

        if (page < 1) {
            return NextResponse.json(
                { error: 'Page must be greater than 0' },
                { status: 400 }
            )
        }

        const where: Prisma.FoodWhereInput = {
            IsAvailable: isAvailable !== null ? isAvailable === 'true' : true,
        }

        // Filter by restaurant if provided
        if (restaurantId) {
            where.EnterpriseID = restaurantId
        }

        // Filter by category if provided
        if (category) {
            where.foodCategory = {
                CategoryName: category
            }
        }

        // Add search functionality
        if (search) {
            where.OR = [
                { DishName: { contains: search } },
                { Description: { contains: search } },
            ]
        }

        const skip = (page - 1) * limit

        const [foods, total] = await Promise.all([
            retryDatabaseOperation(() => prisma.food.findMany({
                where,
                include: {
                    foodCategory: {
                        select: {
                            CategoryID: true,
                            CategoryName: true,
                        }
                    },
                    enterprise: {
                        select: {
                            EnterpriseID: true,
                            EnterpriseName: true,
                            Address: true,
                            PhoneNumber: true,
                            OpenHours: true,
                            CloseHours: true,
                            IsActive: true,
                        }
                    }
                },
                orderBy: [
                    { Stock: 'desc' }, // Prioritize foods with higher stock
                    { CreatedAt: 'desc' }, // Then by newest
                ],
                skip,
                take: limit,
            })),
            retryDatabaseOperation(() => prisma.food.count({ where }))
        ])

        // Transform the data to match the expected interface
        const transformedFoods = foods.map(food => {
            return {
                foodId: food.FoodID,
                dishName: food.DishName,
                price: Number(food.Price),
                stock: food.Stock,
                description: food.Description || '',
                imageUrl: food.ImageURL || '',
                restaurantId: food.enterprise.EnterpriseID,
                menu: {
                    menuId: food.foodCategory.CategoryID,
                    category: food.foodCategory.CategoryName,
                },
                restaurant: {
                    id: food.enterprise.EnterpriseID,
                    name: food.enterprise.EnterpriseName,
                    address: food.enterprise.Address,
                    phone: food.enterprise.PhoneNumber,
                    openHours: food.enterprise.OpenHours,
                    closeHours: food.enterprise.CloseHours,
                    isActive: food.enterprise.IsActive,
                }
            }
        })

        return NextResponse.json({
            foods: transformedFoods,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        })
    } catch (error) {
        console.error('Error fetching popular foods:', error)
        return NextResponse.json(
            { error: 'Failed to fetch popular foods' },
            { status: 500 }
        )
    }
}
