import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        const menuItem = await prisma.food.findUnique({
            where: { FoodID: id },
            include: {
                foodCategory: true,
                menuFoods: {
                    include: {
                        menu: {
                            include: {
                                enterprise: true,
                            }
                        }
                    }
                }
            }
        })

        if (!menuItem) {
            return NextResponse.json(
                { error: 'Menu item not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(menuItem)
    } catch (error) {
        console.error('Error fetching menu item:', error)
        return NextResponse.json(
            { error: 'Failed to fetch menu item' },
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
            price,
            image,
            isAvailable
        } = body

        const menuItem = await prisma.food.update({
            where: { FoodID: id },
            data: {
                DishName: name ?? undefined,
                Description: description ?? undefined,
                Price: price ? parseFloat(price) : undefined,
                ImageURL: image ?? undefined,
                IsAvailable: typeof isAvailable === 'boolean' ? isAvailable : undefined,
            },
            include: {
                foodCategory: true,
                menuFoods: true,
            }
        })

        return NextResponse.json(menuItem)
    } catch (error) {
        console.error('Error updating menu item:', error)
        return NextResponse.json(
            { error: 'Failed to update menu item' },
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

        await prisma.food.delete({
            where: { FoodID: id }
        })

        return NextResponse.json(
            { message: 'Menu item deleted successfully' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error deleting menu item:', error)
        return NextResponse.json(
            { error: 'Failed to delete menu item' },
            { status: 500 }
        )
    }
}
