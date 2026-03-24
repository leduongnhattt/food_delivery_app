import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * PATCH /api/admin/reviews/[id]
 * Toggle review visibility (hide/show)
 * Body: { isHidden: boolean }
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    // Apply rate limiting
    const rateLimitResult = rateLimit({
        key: `admin_reviews_patch:${getClientIp(request)}`,
        limit: 30,
        windowMs: 60 * 1000
    })

    if (!rateLimitResult.allowed) {
        const retryAfter = Math.max(0, Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000))
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfter),
                    'X-RateLimit-Limit': '30',
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(rateLimitResult.resetAt)
                }
            }
        )
    }

    const rateLimitHeaders = {
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.resetAt)
    }

    try {
        // Require admin authentication
        const authResult = requireAdmin(request)
        if (!authResult.success || !authResult.user) {
            return NextResponse.json(
                { error: authResult.error || 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: reviewId } = await context.params
        const body = await request.json()
        const { isHidden } = body

        if (typeof isHidden !== 'boolean') {
            return NextResponse.json(
                { error: 'isHidden must be a boolean' },
                { status: 400 }
            )
        }

        // Update review
        // TODO: Uncomment after running migration and regenerating Prisma client
        const review = await prisma.review.update({
            where: { ReviewID: reviewId },
            data: { IsHidden: isHidden } as any, // TODO: Remove cast after migration
            include: {
                customer: {
                    select: {
                        account: {
                            select: {
                                Username: true
                            }
                        }
                    }
                },
                enterprise: {
                    select: {
                        EnterpriseName: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            review: {
                id: review.ReviewID,
                isHidden: review.IsHidden
            }
        }, {
            headers: rateLimitHeaders
        })

    } catch (error) {
        console.error('Error updating review:', error)
        if (error instanceof Error && error.message.includes('Record to update does not exist')) {
            return NextResponse.json(
                { error: 'Review not found' },
                { status: 404, headers: rateLimitHeaders }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update review' },
            { status: 500, headers: rateLimitHeaders }
        )
    }
}

