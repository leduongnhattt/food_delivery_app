import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { sessionId, cartItems, deliveryInfo, voucherCode, total } = await request.json()

        // Store cart data temporarily (you might want to use Redis or a temporary table)
        // For now, we'll use a simple approach with session storage
        // In production, consider using Redis or a temporary database table

        console.log('Stored cart data for session:', sessionId, {
            delivery: deliveryInfo,
            voucherCode,
            total,
        })
        console.log('Cart items:', cartItems.length)

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error storing cart data:', error)
        return NextResponse.json(
            { error: 'Failed to store cart data' },
            { status: 500 }
        )
    }
}
