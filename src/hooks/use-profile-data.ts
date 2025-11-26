import { useState, useEffect } from 'react'
import { CustomerService } from '@/services/customer.service'
import { useAuth } from './use-auth'

export interface ProfileData {
    fullName: string
    email: string
    phone: string
    address: string
    avatar?: string
}

export interface Notification {
    type: 'success' | 'error'
    message: string
}

export function useProfileData() {
    const { user, isAuthenticated } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const emptyProfile: ProfileData = {
        fullName: '',
        email: '',
        phone: '',
        address: '',
        avatar: ''
    }
    const [profileData, setProfileData] = useState<ProfileData>(emptyProfile)
    const [originalProfileData, setOriginalProfileData] = useState<ProfileData>(emptyProfile)
    const [notification, setNotification] = useState<Notification | null>(null)

    // Fetch customer data on mount/auth ready
    useEffect(() => {
        const loadProfileData = async () => {
            if (!isAuthenticated || !user?.id) return

            try {
                const customer = await CustomerService.getByAccount(user.id)
                if (customer) {
                    // Fetch account to get avatar via lightweight profile endpoint if available
                    let avatarUrl = ''
                    try {
                        const res = await fetch('/api/account/me', { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` || '' } })
                        if (res.ok) {
                            const data = await res.json()
                            avatarUrl = data?.avatar || ''
                        }
                    } catch { }
                    const hydratedProfile: ProfileData = {
                        fullName: customer.FullName || '',
                        email: (user as any)?.email || '',
                        phone: customer.PhoneNumber || '',
                        address: customer.Address || '',
                        avatar: avatarUrl
                    }
                    setProfileData(hydratedProfile)
                    setOriginalProfileData({ ...hydratedProfile })
                }
            } catch (error) {
                console.error('Failed to load profile data:', error)
            }
        }

        loadProfileData()
    }, [isAuthenticated, user])

    // Auto-hide notification after 3 seconds
    useEffect(() => {
        if (!notification) return
        const timer = setTimeout(() => setNotification(null), 3000)
        return () => clearTimeout(timer)
    }, [notification])

    // Update field value
    const updateField = (field: keyof ProfileData, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }))
    }

    // Save profile data
    const saveProfile = async () => {
        try {
            const result = await CustomerService.updateSelf({
                fullName: profileData.fullName,
                phone: profileData.phone,
                address: profileData.address,
            })

            if (result.success) {
                setNotification({ type: 'success', message: 'Profile updated successfully!' })
                setIsEditing(false)
                setOriginalProfileData({ ...profileData })
                return true
            } else {
                setNotification({ type: 'error', message: result.error || 'Failed to update profile' })
                return false
            }
        } catch (error) {
            console.error('Failed to update profile:', error)
            setNotification({ type: 'error', message: 'Failed to update profile' })
            return false
        }
    }

    // Clear notification
    const clearNotification = () => {
        setNotification(null)
    }

    const resetProfileChanges = () => {
        setProfileData({ ...originalProfileData })
        setIsEditing(false)
    }

    return {
        profileData,
        isEditing,
        notification,
        setIsEditing,
        updateField,
        saveProfile,
        clearNotification,
        resetProfileChanges
    }
}
