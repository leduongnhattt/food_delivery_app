import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { uploadBufferToCloudinary } from '@/lib/cloudinary'
import { withRateLimit, getClientIp } from '@/lib/rate-limit'

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

        // Validate mime type (allow jpeg/png/webp only)
        const allowed = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowed.includes(file.type)) {
            return NextResponse.json({ error: 'Only JPEG, PNG, WEBP images are allowed' }, { status: 400 })
        }

        // Limit ~3MB
        const maxBytes = 3 * 1024 * 1024
        if (file.size > maxBytes) {
            return NextResponse.json({ error: 'File too large (max 3MB)' }, { status: 413 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const publicUrl = await uploadBufferToCloudinary(buffer, file.type, {
            folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'hanala/avatars',
            maxBytes: 3 * 1024 * 1024,
            allowedMime: ['image/jpeg', 'image/png', 'image/webp']
        })

        await prisma.account.update({
            where: { AccountID: auth.user.id },
            data: { Avatar: publicUrl }
        })

        return NextResponse.json({ success: true, url: publicUrl })
    } catch (err) {
        console.error('Avatar upload failed:', err)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}, (req) => ({ key: `avatar_up:${getClientIp(req)}`, limit: 10, windowMs: 5 * 60 * 1000 }))


