import { Button } from '@/components/ui/button'
import { Camera, Edit } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { buildAuthHeader } from '@/lib/auth-helpers'
import { useToast } from '@/contexts/toast-context'

interface ProfileSummaryProps {
  fullName: string
  email: string
  isEditing: boolean
  onEdit: () => void
  avatarUrl?: string | null
}

export function ProfileSummary({ fullName, email, isEditing, onEdit, avatarUrl: avatarFromProps }: ProfileSummaryProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const { showToast } = useToast()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(avatarFromProps || null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => { setAvatarUrl(avatarFromProps || null) }, [avatarFromProps])

  const onPickFile = () => fileInputRef.current?.click()

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          ...buildAuthHeader()
        },
        body: form
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Upload failed')
      }
      const json = await res.json()
      if (json?.url) {
        setAvatarUrl(json.url as string)
        // Broadcast to header/user-menu to update avatar instantly
        window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { url: json.url } }))
      }
      showToast('Avatar updated successfully', 'success', 3000)
    } catch (err) {
      console.error(err)
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error', 4000)
    } finally {
      // Re-enable button and allow re-selecting the same file
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-3xl font-bold border border-gray-300 overflow-hidden">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover cursor-zoom-in" onClick={() => setPreviewOpen(true)} />
          ) : (
            fullName.charAt(0).toUpperCase()
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        <Button size="sm" onClick={onPickFile} disabled={uploading} className="absolute -bottom-2 -right-2 bg-orange-600 hover:bg-orange-700 rounded-full w-9 h-9 p-0 text-white">
          <Camera className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-lg font-semibold text-gray-900 truncate">{fullName}</div>
        <div className="text-gray-600 truncate">{email}</div>
      </div>
      {!isEditing && (
        <Button onClick={onEdit} className="bg-orange-600 hover:bg-orange-700 text-white">
          <Edit className="w-4 h-4 mr-2" />Edit
        </Button>
      )}
      {previewOpen && avatarUrl && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setPreviewOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt="avatar preview" className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain" />
        </div>
      )}
    </div>
  )
}

