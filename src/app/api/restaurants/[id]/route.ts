import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { retryDatabaseOperation } from '@/lib/retry-utils'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        const restaurant = await retryDatabaseOperation(() => prisma.enterprise.findUnique({
            where: { EnterpriseID: id },
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
                    include: {
                        foodCategory: {
                            select: {
                                CategoryID: true,
                                CategoryName: true
                            }
                        }
                    },
                    orderBy: {
                        CreatedAt: 'desc'
                    }
                },
                reviews: {
                    select: {
                        Rating: true,
                        Comment: true,
                        CreatedAt: true,
                        customer: {
                            select: {
                                FullName: true
                            }
                        }
                    },
                    orderBy: {
                        CreatedAt: 'desc'
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
            }
        }))

        if (!restaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            )
        }

        // Calculate average rating
        const ratings = restaurant.reviews.map(r => r.Rating).filter(r => r !== null) as number[]
        const averageRating = ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0

        // Transform foods to match expected interface
        const transformedFoods = restaurant.foods.map(food => ({
            foodId: food.FoodID,
            dishName: food.DishName,
            price: Number(food.Price),
            stock: food.Stock,
            description: food.Description || '',
            imageUrl: food.ImageURL || '',
            restaurantId: restaurant.EnterpriseID,
            menu: {
                menuId: food.foodCategory.CategoryID,
                category: food.foodCategory.CategoryName,
            }
        }))

        // Transform reviews
        const transformedReviews = restaurant.reviews.map(review => ({
            id: '', // No review ID in current schema
            rating: review.Rating || 0,
            comment: review.Comment || '',
            customerName: review.customer.FullName,
            createdAt: review.CreatedAt
        }))

        // Transform restaurant data
        const transformedRestaurant = {
            id: restaurant.EnterpriseID,
            name: restaurant.EnterpriseName,
            description: restaurant.Description || '',
            address: restaurant.Address,
            phone: restaurant.PhoneNumber,
            avatarUrl: restaurant.account.Avatar || '', // Use avatar from account
            rating: Math.round(averageRating * 10) / 10,
            deliveryTime: '30-45 min', // Default
            minimumOrder: 0, // Default
            isOpen: restaurant.IsActive,
            openHours: restaurant.OpenHours,
            closeHours: restaurant.CloseHours,
            createdAt: restaurant.CreatedAt,
            updatedAt: restaurant.UpdatedAt,
            foods: transformedFoods,
            reviews: transformedReviews,
            totalFoods: restaurant._count.foods,
            totalReviews: restaurant._count.reviews
        }

        return NextResponse.json(transformedRestaurant)
    } catch (error) {
        console.error('Error fetching restaurant:', error)
        return NextResponse.json(
            { error: 'Failed to fetch restaurant' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const body = await request.json()
        const {
            name,
            description,
            address,
            phone,
            openHours,
            closeHours,
            isOpen
        } = body

        const restaurant = await prisma.enterprise.update({
            where: { EnterpriseID: id },
            data: {
                EnterpriseName: name,
                Description: description,
                Address: address,
                PhoneNumber: phone,
                OpenHours: openHours,
                CloseHours: closeHours,
                IsActive: isOpen,
            }
        })

        return NextResponse.json(restaurant)
    } catch (error) {
        console.error('Error updating restaurant:', error)
        return NextResponse.json(
            { error: 'Failed to update restaurant' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        await prisma.enterprise.delete({
            where: { EnterpriseID: id }
        })

        return NextResponse.json(
            { message: 'Restaurant deleted successfully' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error deleting restaurant:', error)
        return NextResponse.json(
            { error: 'Failed to delete restaurant' },
            { status: 500 }
        )
    }
}
