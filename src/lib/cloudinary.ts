import crypto from 'crypto'

export type UploadOptions = {
    folder: string
    maxBytes?: number
    allowedMime?: string[]
}

export async function uploadBufferToCloudinary(buffer: Buffer, mimeType: string, opts: UploadOptions): Promise<string> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('Cloudinary is not configured')
    }

    const allowed = opts.allowedMime || ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(mimeType)) {
        throw new Error('Unsupported file type')
    }

    const maxBytes = opts.maxBytes ?? 5 * 1024 * 1024
    if (buffer.byteLength > maxBytes) {
        throw new Error('File too large')
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const paramsToSign = `folder=${opts.folder}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex')

    const formData = new FormData()
    formData.append('file', `data:${mimeType};base64,${buffer.toString('base64')}`)
    formData.append('api_key', apiKey)
    formData.append('timestamp', String(timestamp))
    formData.append('signature', signature)
    formData.append('folder', opts.folder)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
    })
    if (!res.ok) {
        const t = await res.text()
        throw new Error(t || 'Upload to cloud failed')
    }
    const uploaded = await res.json() as { secure_url?: string }
    if (!uploaded.secure_url) throw new Error('Cloud upload missing URL')
    return uploaded.secure_url
}


