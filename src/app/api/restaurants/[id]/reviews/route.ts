import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * GET /api/restaurants/[id]/reviews
 * Get all reviews for a restaurant with optional sorting
 * Query params: sort (newest|oldest), page, limit
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    // Apply rate limiting
    const rateLimitResult = rateLimit({
        key: `rest_reviews_get:${getClientIp(request)}`,
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

    // Rate limit headers for all responses
    const rateLimitHeaders = {
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.resetAt)
    }

    let enterpriseId: string | undefined
    try {
        const params = await context.params
        enterpriseId = params.id
        
        if (!enterpriseId) {
            console.error('Missing enterpriseId in params')
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400, headers: rateLimitHeaders }
            )
        }

        const { searchParams } = new URL(request.url)
        const sort = searchParams.get('sort') || 'newest' // newest or oldest
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '50', 10)

        console.log(`[Reviews API] Fetching reviews for enterprise: ${enterpriseId}, sort: ${sort}, page: ${page}, limit: ${limit}`)

        if (page < 1) {
            return NextResponse.json(
                { error: 'Page must be greater than 0' },
                { status: 400, headers: rateLimitHeaders }
            )
        }

        if (limit < 1 || limit > 100) {
            return NextResponse.json(
                { error: 'Limit must be between 1 and 100' },
                { status: 400, headers: rateLimitHeaders }
            )
        }

        if (sort !== 'newest' && sort !== 'oldest') {
            return NextResponse.json(
                { error: 'Sort must be either "newest" or "oldest"' },
                { status: 400, headers: rateLimitHeaders }
            )
        }

        // Verify enterprise exists
        const enterprise = await prisma.enterprise.findUnique({
            where: { EnterpriseID: enterpriseId },
            select: { EnterpriseID: true }
        })

        if (!enterprise) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404, headers: rateLimitHeaders }
            )
        }

        const skip = (page - 1) * limit

        // Fetch reviews with customer info (exclude hidden reviews)
        let reviews, total
        try {
            [reviews, total] = await Promise.all([
                prisma.review.findMany({
                    where: {
                        EnterpriseID: enterpriseId
                        // TODO: Add IsHidden: false after running migration
                        // IsHidden: false // Only show active reviews
                    },
                    include: {
                        customer: {
                            select: {
                                CustomerID: true,
                                account: {
                                    select: {
                                        Username: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        CreatedAt: sort === 'newest' ? 'desc' : 'asc'
                    },
                    skip,
                    take: limit
                }),
            prisma.review.count({
                where: {
                    EnterpriseID: enterpriseId
                    // TODO: Add IsHidden: false after running migration
                    // IsHidden: false // Only count active reviews
                }
            })
            ])
        } catch (dbError) {
            console.error('Database error fetching reviews:', dbError)
            throw new Error(`Database query failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`)
        }

        // Calculate average rating from all reviews (not just current page)
        // Only count reviews with valid ratings (1-5), exclude null and 0, and hidden reviews
        let allRatings: Array<{ Rating: number | null }>
        try {
            allRatings = await prisma.review.findMany({
                where: {
                    EnterpriseID: enterpriseId,
                    Rating: { 
                        not: null,
                        gte: 1,
                        lte: 5
                    }
                    // TODO: Add IsHidden: false after running migration
                    // IsHidden: false // Only count active reviews for rating calculation
                },
                select: {
                    Rating: true
                }
            })
        } catch (dbError) {
            console.error('Database error calculating average rating:', dbError)
            // Continue with empty ratings array if this fails
            allRatings = []
        }

        const ratings = allRatings
            .map(r => r.Rating)
            .filter((r): r is number => r !== null && typeof r === 'number' && r >= 1 && r <= 5)
        
        const averageRating = ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0

        // Format reviews - handle null customer/account gracefully
        const formattedReviews = reviews.map(review => {
            try {
                return {
                    id: review.ReviewID,
                    author: review.customer?.account?.Username || 'Anonymous',
                    rating: review.Rating ?? 0,
                    content: review.Comment || '',
                    images: (review.Images && Array.isArray(review.Images) ? review.Images : []) as string[],
                    createdAt: review.CreatedAt.toISOString(),
                    updatedAt: review.UpdatedAt?.toISOString() || null
                }
            } catch (formatError) {
                console.error('Error formatting review:', formatError, review)
                // Return a safe default
                return {
                    id: review.ReviewID,
                    author: 'Anonymous',
                    rating: 0,
                    content: '',
                    images: [],
                    createdAt: review.CreatedAt.toISOString(),
                    updatedAt: review.UpdatedAt?.toISOString() || null
                }
            }
        })

        return NextResponse.json({
            reviews: formattedReviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            totalReviews: total
        }, {
            headers: rateLimitHeaders
        })

    } catch (error) {
        console.error('[Reviews API] Error fetching reviews:', error)
        console.error('[Reviews API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        console.error('[Reviews API] Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'Unknown',
            enterpriseId: enterpriseId || 'unknown'
        })
        
        // Return detailed error in development, generic in production
        const errorMessage = process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : 'Unknown error')
            : 'Failed to fetch reviews'
        
        return NextResponse.json(
            { 
                error: errorMessage,
                reviews: [],
                pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
                averageRating: 0,
                totalReviews: 0
            },
            { 
                status: 500,
                headers: rateLimitHeaders
            }
        )
    }
}

