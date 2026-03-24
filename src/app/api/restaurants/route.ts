import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireEnterprise } from '@/lib/auth-helpers'
import { Prisma } from '@/generated/prisma'
import { retryDatabaseOperation } from '@/lib/retry-utils'
import { withRateLimit, getClientIp } from '@/lib/rate-limit'

export const GET = withRateLimit(async (request: NextRequest) => {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search')
        const category = searchParams.get('category')
        const isOpen = searchParams.get('isOpen')
        const minRating = searchParams.get('minRating')

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

        const where: Prisma.EnterpriseWhereInput = {
            IsActive: true, // Only show active restaurants
        }

        if (search) {
            where.OR = [
                { EnterpriseName: { contains: search } },
                { Description: { contains: search } },
            ]
        }

        if (category) {
            where.foods = {
                some: {
                    foodCategory: {
                        CategoryName: category
                    },
                    IsAvailable: true
                }
            }
        }

        if (isOpen !== null) {
            where.IsActive = isOpen === 'true'
        }

        if (minRating) {
            where.reviews = {
                some: {
                    Rating: {
                        gte: parseInt(minRating)
                    }
                }
            }
        }

        const skip = (page - 1) * limit

        const [restaurants, total] = await Promise.all([
            retryDatabaseOperation(() => prisma.enterprise.findMany({
                where,
                include: {
                    account: {
                        select: {
                            Avatar: true
                        }
                    },
                    foods: {
                        where: {
                            IsAvailable: true
                        },
                        select: {
                            FoodID: true,
                            DishName: true,
                            Price: true,
                            ImageURL: true,
                            foodCategory: {
                                select: {
                                    CategoryName: true
                                }
                            }
                        },
                        take: 5 // Limit to 5 foods per restaurant for performance
                    },
                    reviews: {
                        select: {
                            Rating: true
                        }
                    },
                    _count: {
                        select: {
                            foods: {
                                where: {
                                    IsAvailable: true
                                }
                            },
                            reviews: true
                        }
                    }
                },
                orderBy: {
                    CreatedAt: 'desc'
                },
                skip,
                take: limit,
            })),
            retryDatabaseOperation(() => prisma.enterprise.count({ where }))
        ])

        // Transform the data to match the expected interface
        const transformedRestaurants = restaurants.map(restaurant => {
            // Calculate average rating
            const ratings = restaurant.reviews.map(r => r.Rating).filter(r => r !== null) as number[]
            const averageRating = ratings.length > 0
                ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
                : 0

            // Get popular foods (first 5)
            const popularFoods = restaurant.foods.slice(0, 5).map(food => ({
                foodId: food.FoodID,
                dishName: food.DishName,
                price: Number(food.Price),
                imageUrl: food.ImageURL || '',
                category: food.foodCategory.CategoryName
            }))

            return {
                id: restaurant.EnterpriseID,
                name: restaurant.EnterpriseName,
                description: restaurant.Description || '',
                address: restaurant.Address,
                phone: restaurant.PhoneNumber,
                avatarUrl: restaurant.account.Avatar || '', // Use avatar from account
                rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
                deliveryTime: '30-45 min', // Default delivery time
                minimumOrder: 0, // Default minimum order
                isOpen: restaurant.IsActive,
                openHours: restaurant.OpenHours,
                closeHours: restaurant.CloseHours,
                createdAt: restaurant.CreatedAt,
                updatedAt: restaurant.UpdatedAt,
                popularFoods,
                totalFoods: restaurant._count.foods,
                totalReviews: restaurant._count.reviews
            }
        })

        return NextResponse.json({
            restaurants: transformedRestaurants,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        })
    } catch (error) {
        console.error('Error fetching restaurants:', error)
        return NextResponse.json(
            { error: 'Failed to fetch restaurants' },
            { status: 500 }
        )
    }
}, (req) => ({ key: `restaurants:${getClientIp(req)}`, limit: 60, windowMs: 60 * 1000 }))

export async function POST(request: NextRequest) {
    try {
        // Require enterprise authentication
        const authResult = requireEnterprise(request)
        if (!authResult.success) {
            return NextResponse.json(
                { error: authResult.error },
                { status: 401 }
            )
        }

        const user = authResult.user!
        const body = await request.json()
        const {
            name,
            description,
            address,
            phone,
            openHours,
            closeHours,
            isActive = true
        } = body

        if (!name || !description || !address || !phone) {
            return NextResponse.json(
                { error: 'Name, description, address, and phone are required' },
                { status: 400 }
            )
        }

        const restaurant = await prisma.enterprise.create({
            data: {
                EnterpriseName: name,
                Description: description,
                Address: address,
                PhoneNumber: phone,
                OpenHours: openHours || '08:00',
                CloseHours: closeHours || '22:00',
                IsActive: isActive,
                AccountID: user.id,
            }
        })

        return NextResponse.json(restaurant, { status: 201 })
    } catch (error) {
        console.error('Error creating restaurant:', error)
        return NextResponse.json(
            { error: 'Failed to create restaurant' },
            { status: 500 }
        )
    }
}
