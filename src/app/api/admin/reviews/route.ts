import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * GET /api/admin/reviews
 * Get all reviews with filtering and search
 * Query params: q (search), enterpriseId, status (all|active|hidden), startDate, endDate
 */
export async function GET(request: NextRequest) {
    // Apply rate limiting
    const rateLimitResult = rateLimit({
        key: `admin_reviews_get:${getClientIp(request)}`,
        limit: 60,
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
                    'X-RateLimit-Limit': '60',
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(rateLimitResult.resetAt)
                }
            }
        )
    }

    const rateLimitHeaders = {
        'X-RateLimit-Limit': '60',
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

        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')?.trim() || ''
        const enterpriseId = searchParams.get('enterpriseId') || ''
        const status = searchParams.get('status') || 'all' // all, active, hidden
        const startDate = searchParams.get('startDate') || ''
        const endDate = searchParams.get('endDate') || ''

        // Build where clause
        const where: any = {}

        // Filter by hidden status
        // TODO: Uncomment after running migration and regenerating Prisma client
        // if (status === 'active') {
        //     where.IsHidden = false
        // } else if (status === 'hidden') {
        //     where.IsHidden = true
        // }

        // Filter by enterprise
        if (enterpriseId) {
            where.EnterpriseID = enterpriseId
        }

        // Filter by date range
        if (startDate || endDate) {
            where.CreatedAt = {}
            if (startDate) {
                where.CreatedAt.gte = new Date(startDate)
            }
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999) // End of day
                where.CreatedAt.lte = end
            }
        }

        // Search by comment, customer name, or enterprise name
        if (q) {
            where.OR = [
                { Comment: { contains: q } },
                { customer: { account: { Username: { contains: q } } } },
                { enterprise: { EnterpriseName: { contains: q } } }
            ]
        }

        // Fetch reviews
        const reviews = await prisma.review.findMany({
            where,
            include: {
                customer: {
                    select: {
                        account: {
                            select: {
                                Username: true,
                                Email: true
                            }
                        }
                    }
                },
                enterprise: {
                    select: {
                        EnterpriseID: true,
                        EnterpriseName: true
                    }
                }
            },
            orderBy: {
                CreatedAt: 'desc'
            },
            take: 100
        })

        // Format response
        const formattedReviews = reviews.map(review => ({
            id: review.ReviewID,
            customerName: review.customer?.account?.Username || 'Anonymous',
            customerEmail: review.customer?.account?.Email || '',
            enterpriseId: review.enterprise?.EnterpriseID || '',
            enterpriseName: review.enterprise?.EnterpriseName || '',
            rating: review.Rating || 0,
            comment: review.Comment || '',
            images: (review.Images && Array.isArray(review.Images) ? review.Images : []) as string[],
            createdAt: review.CreatedAt.toISOString(),
            updatedAt: review.UpdatedAt?.toISOString() || null,
            isHidden: (review as any).IsHidden ?? false // TODO: Remove cast after migration
        }))

        return NextResponse.json({
            reviews: formattedReviews,
            total: formattedReviews.length
        }, {
            headers: rateLimitHeaders
        })

    } catch (error) {
        console.error('Error fetching reviews:', error)
        return NextResponse.json(
            { error: 'Failed to fetch reviews' },
            { status: 500, headers: rateLimitHeaders }
        )
    }
}

