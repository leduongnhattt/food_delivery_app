import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { uploadBufferToCloudinary } from '@/lib/cloudinary'
import { withRateLimit, getClientIp } from '@/lib/rate-limit'

// Upload a food image to Cloudinary and return the public URL
export const POST = withRateLimit(async (request: NextRequest) => {
    try {
        const auth = getAuthenticatedUser(request)
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const form = await request.formData()
        const file = form.get('file') as File | null
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const url = await uploadBufferToCloudinary(buffer, file.type, {
            folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'hanala/foods',
            maxBytes: 5 * 1024 * 1024,
            allowedMime: ['image/jpeg', 'image/png', 'image/webp']
        })
        return NextResponse.json({ url })
    } catch (err) {
        console.error('Food image upload failed:', err)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}, (req) => ({ key: `food_img_up:${getClientIp(req)}`, limit: 15, windowMs: 5 * 60 * 1000 }))


