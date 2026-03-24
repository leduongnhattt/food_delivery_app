import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')
        const category = searchParams.get('category')
        const isOpen = searchParams.get('isOpen')
        const minRating = searchParams.get('minRating')
        const maxPrice = searchParams.get('maxPrice')

        const where: Prisma.EnterpriseWhereInput = {}

        // Search by restaurant name or description
        if (query) {
            where.OR = [
                { EnterpriseName: { contains: query } },
                { Description: { contains: query } },
            ]
        }

        // Build menu filters
        const menuFilters: Prisma.MenuWhereInput = {};

        // Filter by category
        if (category) {
            menuFilters.menuFoods = {
                some: {
                    food: {
                        foodCategory: {
                            CategoryName: category
                        }
                    }
                }
            };
        }

        // Filter by maximum price
        if (maxPrice) {
            const priceFilter = {
                food: {
                    Price: {
                        lte: parseFloat(maxPrice)
                    }
                }
            };

            if (menuFilters.menuFoods) {
                // Combine with existing category filter
                menuFilters.menuFoods.some = {
                    ...menuFilters.menuFoods.some,
                    ...priceFilter
                };
            } else {
                menuFilters.menuFoods = {
                    some: priceFilter
                };
            }
        }

        // Apply menu filters if any
        if (Object.keys(menuFilters).length > 0) {
            where.menus = {
                some: menuFilters
            };
        }

        // Filter by active status
        if (isOpen !== null) {
            where.IsActive = isOpen === 'true'
        }

        // Filter by minimum rating (through reviews)
        if (minRating) {
            where.reviews = {
                some: {
                    Rating: {
                        gte: parseInt(minRating)
                    }
                }
            }
        }

        const restaurants = await prisma.enterprise.findMany({
            where,
            include: {
                menus: {
                    include: {
                        menuFoods: {
                            where: {
                                food: {
                                    IsAvailable: true
                                }
                            },
                            include: {
                                food: {
                                    select: {
                                        FoodID: true,
                                        DishName: true,
                                        Price: true,
                                        foodCategory: {
                                            select: {
                                                CategoryName: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                reviews: {
                    select: {
                        Rating: true
                    }
                },
                _count: {
                    select: {
                        menus: true,
                        reviews: true
                    }
                }
            },
            orderBy: {
                CreatedAt: 'desc'
            }
        })

        return NextResponse.json(restaurants)
    } catch (error) {
        console.error('Search error:', error)
        return NextResponse.json(
            { error: 'Search failed' },
            { status: 500 }
        )
    }
}
