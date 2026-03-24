import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma'
import { withRateLimit, getClientIp } from '@/lib/rate-limit'

export const GET = withRateLimit(async (request: NextRequest) => {
    try {
        const { searchParams } = new URL(request.url)
        const restaurantId = searchParams.get('restaurantId')
        const category = searchParams.get('category')
        const search = searchParams.get('search')
        const isAvailable = searchParams.get('isAvailable')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const where: Prisma.FoodWhereInput = {}

        if (restaurantId) {
            // Filter foods that belong to menus of the specified enterprise
            where.menuFoods = {
                some: {
                    menu: {
                        EnterpriseID: restaurantId
                    }
                }
            }
        }

        if (category) {
            // Filter by food category name
            where.foodCategory = {
                CategoryName: category
            }
        }

        if (search) {
            where.OR = [
                { DishName: { contains: search } },
                { Description: { contains: search } },
            ]
        }

        if (isAvailable !== null) {
            where.IsAvailable = isAvailable === 'true'
        }

        const skip = (page - 1) * limit

        const [menuItems, total] = await Promise.all([
            prisma.food.findMany({
                where,
                include: {
                    foodCategory: {
                        select: {
                            CategoryID: true,
                            CategoryName: true,
                        }
                    },
                    menuFoods: {
                        include: {
                            menu: {
                                include: {
                                    enterprise: {
                                        select: {
                                            EnterpriseID: true,
                                            EnterpriseName: true,
                                            Address: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: [
                    { foodCategory: { CategoryName: 'asc' } },
                    { DishName: 'asc' }
                ],
                skip,
                take: limit,
            }),
            prisma.food.count({ where })
        ])

        return NextResponse.json({
            menuItems,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        })
    } catch (error) {
        console.error('Error fetching menu items:', error)
        return NextResponse.json(
            { error: 'Failed to fetch menu items' },
            { status: 500 }
        )
    }
}, (req) => ({ key: `menu_items:${getClientIp(req)}`, limit: 60, windowMs: 60 * 1000 }))

export const POST = withRateLimit(async (request: NextRequest) => {
    try {
        const body = await request.json()
        const {
            name,
            description,
            price,
            image,
            category,
            isAvailable = true,
            restaurantId
        } = body

        if (!name || !description || !price || !category || !restaurantId) {
            return NextResponse.json(
                { error: 'Name, description, price, category, and restaurantId are required' },
                { status: 400 }
            )
        }

        // Verify restaurant exists
        const restaurant = await prisma.enterprise.findUnique({
            where: { EnterpriseID: restaurantId }
        })

        if (!restaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            )
        }

        // Resolve category by name to get CategoryID
        const existingCategory = await prisma.foodCategory.findFirst({
            where: { CategoryName: category }
        })

        if (!existingCategory) {
            return NextResponse.json(
                { error: 'Food category not found' },
                { status: 400 }
            )
        }

        const createdFood = await prisma.food.create({
            data: {
                DishName: name,
                Description: description,
                Price: parseFloat(price),
                ImageURL: image || null,
                FoodCategoryID: existingCategory.CategoryID,
                EnterpriseID: restaurantId,
                IsAvailable: Boolean(isAvailable),
            },
            include: {
                foodCategory: {
                    select: {
                        CategoryID: true,
                        CategoryName: true,
                    }
                },
                menuFoods: {
                    include: {
                        menu: {
                            include: {
                                enterprise: {
                                    select: {
                                        EnterpriseID: true,
                                        EnterpriseName: true,
                                        Address: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        // Optionally attach the created food to the enterprise's first menu if exists
        const firstMenu = await prisma.menu.findFirst({
            where: { EnterpriseID: restaurantId },
            orderBy: { CreatedAt: 'asc' }
        })

        if (firstMenu) {
            try {
                await prisma.menuFood.create({
                    data: {
                        FoodID: createdFood.FoodID,
                        MenuID: firstMenu.MenuID,
                    }
                })
            } catch (err) {
                // Silently continue if linking already exists or fails
                console.warn('Failed to link food to menu:', err)
            }
        }

        return NextResponse.json(createdFood, { status: 201 })
    } catch (error) {
        console.error('Error creating menu item:', error)
        return NextResponse.json(
            { error: 'Failed to create menu item' },
            { status: 500 }
        )
    }
}, (req) => ({ key: `menu_items_post:${getClientIp(req)}`, limit: 20, windowMs: 60 * 1000 }))
