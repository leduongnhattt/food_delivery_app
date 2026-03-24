import { NextRequest, NextResponse } from 'next/server'
import { requireCustomer } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { uploadBufferToCloudinary } from '@/lib/cloudinary'
import { withRateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * POST /api/reviews
 * Create a new review for a restaurant
 * Requires: Customer authentication
 * Body: { enterpriseId, rating, comment, images? }
 */
export const POST = withRateLimit(async (request: NextRequest) => {
    try {
        // Require customer authentication
        const authResult = requireCustomer(request)
        if (!authResult.success || !authResult.user) {
            return NextResponse.json(
                { error: authResult.error || 'Unauthorized' },
                { status: 401 }
            )
        }

        const accountId = authResult.user.id

        // Get customer ID from account
        const customer = await prisma.customer.findUnique({
            where: { AccountID: accountId },
            select: { CustomerID: true }
        })

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer profile not found' },
                { status: 404 }
            )
        }

        const formData = await request.formData()
        const enterpriseId = formData.get('enterpriseId') as string
        const ratingStr = formData.get('rating') as string
        const comment = formData.get('comment') as string | null
        const images = formData.getAll('images') as File[]

        // Validation
        if (!enterpriseId) {
            return NextResponse.json(
                { error: 'Enterprise ID is required' },
                { status: 400 }
            )
        }

        const rating = ratingStr ? parseInt(ratingStr, 10) : null
        if (rating !== null && (rating < 1 || rating > 5)) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            )
        }

        // Check if rating or comment is provided
        if (!rating && (!comment || comment.trim().length === 0) && images.length === 0) {
            return NextResponse.json(
                { error: 'At least rating, comment, or image is required' },
                { status: 400 }
            )
        }

        // Validate comment length
        if (comment && comment.length > 200) {
            return NextResponse.json(
                { error: 'Comment must be 200 characters or less' },
                { status: 400 }
            )
        }

        // Validate images (max 6, max 5MB each)
        if (images.length > 6) {
            return NextResponse.json(
                { error: 'Maximum 6 images allowed' },
                { status: 400 }
            )
        }

        // Upload images to Cloudinary
        const imageUrls: string[] = []
        for (const image of images) {
            if (image.size === 0) continue

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
            if (!allowedTypes.includes(image.type)) {
                return NextResponse.json(
                    { error: `Invalid image type: ${image.type}. Only JPEG, PNG, and WebP are allowed` },
                    { status: 400 }
                )
            }

            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024
            if (image.size > maxSize) {
                return NextResponse.json(
                    { error: `Image too large: ${image.name}. Maximum size is 5MB` },
                    { status: 400 }
                )
            }

            try {
                const arrayBuffer = await image.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                const url = await uploadBufferToCloudinary(buffer, image.type, {
                    folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'hanala/reviews',
                    maxBytes: 5 * 1024 * 1024,
                    allowedMime: ['image/jpeg', 'image/png', 'image/webp']
                })
                imageUrls.push(url)
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError)
                return NextResponse.json(
                    { error: `Failed to upload image: ${image.name}` },
                    { status: 500 }
                )
            }
        }

        // Always create a new review (allow multiple reviews from same customer)
        // Note: This requires removing the unique constraint on (CustomerID, EnterpriseID) in the database
        const review = await prisma.review.create({
            data: {
                CustomerID: customer.CustomerID,
                EnterpriseID: enterpriseId,
                Rating: rating,
                Comment: comment?.trim() || null,
                Images: imageUrls.length > 0 ? imageUrls : undefined
            },
            include: {
                customer: {
                    select: {
                        account: {
                            select: {
                                Username: true
                            }
                        }
                    }
                }
            }
        })

        type ReviewWithCustomer = typeof review & { customer?: { account?: { Username?: string | null } } }
        const reviewWithCustomer = review as ReviewWithCustomer
        return NextResponse.json({
            success: true,
            review: {
                id: review.ReviewID,
                author: reviewWithCustomer.customer?.account?.Username || 'Anonymous',
                rating: review.Rating || 0,
                content: review.Comment || '',
                images: (review.Images as string[] | null) || [],
                createdAt: review.CreatedAt.toISOString()
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating review:', error)
        return NextResponse.json(
            { error: 'Failed to create review' },
            { status: 500 }
        )
    }
}, (req) => ({ key: `review_post:${getClientIp(req)}`, limit: 10, windowMs: 60 * 1000 }))

