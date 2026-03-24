import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const ids: string[] = Array.isArray(body?.ids) ? body.ids : []
        if (ids.length === 0) {
            return NextResponse.json({ foods: [] })
        }
        const foods = await prisma.food.findMany({
            where: { FoodID: { in: ids } },
            select: {
                FoodID: true,
                DishName: true,
                Price: true,
                Description: true,
                ImageURL: true,
                EnterpriseID: true,
                foodCategory: { select: { CategoryName: true } },
                enterprise: { select: { EnterpriseName: true } },
            },
        })
        const payload = foods.map(f => ({
            id: f.FoodID,
            name: f.DishName,
            price: Number(f.Price),
            imageUrl: f.ImageURL || '',
            restaurantId: f.EnterpriseID,
            category: f.foodCategory?.CategoryName || '',
            description: f.Description || '',
            restaurantName: f.enterprise?.EnterpriseName || '',
        }))
        return NextResponse.json({ foods: payload })
    } catch (e) {
        console.error('POST /api/foods/by-ids failed', e)
        return NextResponse.json({ error: 'Failed to fetch foods' }, { status: 500 })
    }
}


